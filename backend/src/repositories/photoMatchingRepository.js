import { env } from "../config/env.js";
import { supabaseAdmin } from "../clients/supabaseAdmin.js";

export function createPhotoMatchingRepository(client = supabaseAdmin) {
  return {
    async getPhotoById(photoId) {
      const { data, error } = await client
        .from("event_photos")
        .select("*")
        .eq("id", photoId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async getPhotosByIds(photoIds) {
      if (!photoIds.length) return [];
      const { data, error } = await client
        .from("event_photos")
        .select("*")
        .in("id", photoIds);
      if (error) throw error;
      return data ?? [];
    },

    async getPhotosByEventIds(eventIds) {
      if (!eventIds.length) return [];
      const { data, error } = await client
        .from("event_photos")
        .select("*")
        .in("event_id", eventIds);
      if (error) throw error;
      return data ?? [];
    },

    async updatePhotoProcessing(photoId, updates) {
      const { data, error } = await client
        .from("event_photos")
        .update(updates)
        .eq("id", photoId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async deletePhotoFacesByPhotoId(photoId) {
      const { error } = await client.from("photo_faces").delete().eq("photo_id", photoId);
      if (error) throw error;
    },

    async insertPhotoFaces(rows) {
      if (!rows.length) return [];
      const { data, error } = await client
        .from("photo_faces")
        .upsert(rows, { onConflict: "photo_id,face_index" })
        .select("*");
      if (error) throw error;
      return data ?? [];
    },

    async getPhotoFacesByPhotoIds(photoIds) {
      if (!photoIds.length) return [];
      const { data, error } = await client
        .from("photo_faces")
        .select("*")
        .in("photo_id", photoIds)
        .eq("status", "processed");
      if (error) throw error;
      return data ?? [];
    },

    async deletePhotoPeopleByPhotoId(photoId) {
      const { error } = await client.from("photo_people").delete().eq("photo_id", photoId);
      if (error) throw error;
    },

    async deletePhotoPeopleForUserByPhotoIds({ userId, photoIds }) {
      if (!photoIds.length) return;
      const { error } = await client
        .from("photo_people")
        .delete()
        .eq("person_user_id", userId)
        .in("photo_id", photoIds);
      if (error) throw error;
    },

    async upsertPhotoPeople(rows) {
      if (!rows.length) return [];
      const { data, error } = await client
        .from("photo_people")
        .upsert(rows, { onConflict: "photo_id,person_user_id" })
        .select("*");
      if (error) throw error;
      return data ?? [];
    },

    async getAttendeeUserIdsByEventId(eventId) {
      const { data, error } = await client
        .from("event_attendees")
        .select("user_id")
        .eq("event_id", eventId)
        .not("user_id", "is", null);
      if (error) throw error;
      return (data ?? []).map((row) => row.user_id);
    },

    async getAttendeesByEventId(eventId) {
      const { data, error } = await client
        .from("event_attendees")
        .select("user_id,email")
        .eq("event_id", eventId);
      if (error) throw error;
      return data ?? [];
    },

    async getProfilesByIds(userIds) {
      if (!userIds.length) return [];
      const { data, error } = await client
        .from("profiles")
        .select("id,email,verification_face_embedding,face_verification_completed")
        .in("id", userIds);
      if (error) throw error;
      return data ?? [];
    },

    async getProfilesByEmails(emails) {
      if (!emails.length) return [];
      const { data, error } = await client
        .from("profiles")
        .select("id,email,verification_face_embedding,face_verification_completed")
        .in("email", emails);
      if (error) throw error;
      return data ?? [];
    },

    async getProfileById(userId) {
      const { data, error } = await client
        .from("profiles")
        .select("id,email,verification_face_embedding,face_verification_completed")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

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

      return [...(byUser.data ?? []), ...(byEmail.data ?? [])].map((row) => row.event_id);
    },

    async createSignedPhotoUrl(storagePath, ttlSeconds = 900) {
      const bucket = env.EVENT_PHOTOS_BUCKET;
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(storagePath, ttlSeconds);
      if (error) throw error;
      return data?.signedUrl || null;
    },
  };
}
