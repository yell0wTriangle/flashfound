import { supabaseAdmin } from "../clients/supabaseAdmin.js";
import { env } from "../config/env.js";

export function createEventsRepository(client = supabaseAdmin) {
  return {
    async getAccessibleEventIdsForUser({ userId, email }) {
      const byUserPromise = client
        .from("event_attendees")
        .select("event_id")
        .eq("user_id", userId);

      const byEmailPromise = email
        ? client.from("event_attendees").select("event_id").ilike("email", email)
        : Promise.resolve({ data: [], error: null });

      const [byUser, byEmail] = await Promise.all([byUserPromise, byEmailPromise]);
      if (byUser.error) throw byUser.error;
      if (byEmail.error) throw byEmail.error;

      return [...(byUser.data ?? []), ...(byEmail.data ?? [])];
    },

    async getEventsByIds(eventIds, { privacyType, search }) {
      let query = client
        .from("events")
        .select(
          "id,name,event_date,location,organiser_name,organising_company,cover_image_url,privacy_type,status,created_at",
        )
        .in("id", eventIds)
        .order("event_date", { ascending: false });

      if (privacyType && privacyType !== "all") {
        query = query.eq("privacy_type", privacyType);
      }

      if (search) {
        const escaped = search.replaceAll(",", "\\,");
        query = query.or(
          `name.ilike.%${escaped}%,location.ilike.%${escaped}%,organiser_name.ilike.%${escaped}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },

    async getEventById(eventId) {
      const { data, error } = await client
        .from("events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async getPhotosByEventId(eventId) {
      const { data, error } = await client
        .from("event_photos")
        .select(
          "id,event_id,storage_path,image_url,uploaded_by_user_id,created_at,face_processing_status,face_processing_error,face_processed_at",
        )
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async getPhotoPeopleByPhotoIds(photoIds) {
      if (!photoIds.length) return [];
      const { data, error } = await client
        .from("photo_people")
        .select("photo_id,person_user_id,confidence")
        .in("photo_id", photoIds);
      if (error) throw error;
      return data ?? [];
    },

    async getProfilesByIds(profileIds) {
      if (!profileIds.length) return [];
      const { data, error } = await client
        .from("profiles")
        .select("id,display_name,display_avatar_url")
        .in("id", profileIds);
      if (error) throw error;
      return data ?? [];
    },

    async getPhotosByIds(photoIds) {
      if (!photoIds.length) return [];
      const { data, error } = await client
        .from("event_photos")
        .select(
          "id,event_id,storage_path,image_url,uploaded_by_user_id,created_at,face_processing_status,face_processing_error,face_processed_at",
        )
        .in("id", photoIds);
      if (error) throw error;
      return data ?? [];
    },

    async getPersonIdsByEventId(eventId) {
      const photos = await this.getPhotosByEventId(eventId);
      const photoIds = photos.map((photo) => photo.id);
      if (!photoIds.length) return [];
      const rows = await this.getPhotoPeopleByPhotoIds(photoIds);
      return [...new Set(rows.map((row) => row.person_user_id).filter(Boolean))];
    },

    async getPrivateAccessGrantedTargets({ eventId, requesterUserId }) {
      const { data, error } = await client
        .from("private_access_grants")
        .select("target_user_id")
        .eq("event_id", eventId)
        .eq("requester_user_id", requesterUserId);
      if (error) throw error;
      return (data ?? []).map((row) => row.target_user_id);
    },

    async createSignedPhotoUrl(storagePath, ttlSeconds = 900) {
      const { data, error } = await client.storage
        .from(env.EVENT_PHOTOS_BUCKET)
        .createSignedUrl(storagePath, ttlSeconds);
      if (error) throw error;
      return data?.signedUrl || null;
    },
  };
}
