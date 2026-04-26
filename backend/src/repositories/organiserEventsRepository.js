import { supabaseAdmin } from "../clients/supabaseAdmin.js";

export function createOrganiserEventsRepository(client = supabaseAdmin) {
  return {
    async createEvent(input) {
      const { data, error } = await client.from("events").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },

    async listEventsByOrganiser(organiserUserId) {
      const { data, error } = await client
        .from("events")
        .select("*")
        .eq("organiser_user_id", organiserUserId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async getEventById(eventId) {
      const { data, error } = await client.from("events").select("*").eq("id", eventId).maybeSingle();
      if (error) throw error;
      return data;
    },

    async updateEvent(eventId, updates) {
      const { data, error } = await client
        .from("events")
        .update(updates)
        .eq("id", eventId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async upsertAttendees(rows) {
      if (!rows.length) return [];
      const { data, error } = await client
        .from("event_attendees")
        .upsert(rows, { onConflict: "event_id,email" })
        .select("*");
      if (error) throw error;
      return data ?? [];
    },

    async deleteAttendeeById(attendeeId) {
      const { data, error } = await client
        .from("event_attendees")
        .delete()
        .eq("id", attendeeId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async getAttendeeById(attendeeId) {
      const { data, error } = await client
        .from("event_attendees")
        .select("*")
        .eq("id", attendeeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async getProfilesByEmails(emails) {
      if (!emails.length) return [];
      const { data, error } = await client
        .from("profiles")
        .select("id,email")
        .in("email", emails);
      if (error) throw error;
      return data ?? [];
    },

    async insertPhotos(rows) {
      if (!rows.length) return [];
      const { data, error } = await client.from("event_photos").insert(rows).select("*");
      if (error) throw error;
      return data ?? [];
    },

    async deletePhotosByIds(photoIds) {
      if (!photoIds.length) return [];
      const { data, error } = await client
        .from("event_photos")
        .delete()
        .in("id", photoIds)
        .select("*");
      if (error) throw error;
      return data ?? [];
    },

    async getPhotosByEventId(eventId) {
      const { data, error } = await client
        .from("event_photos")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  };
}

