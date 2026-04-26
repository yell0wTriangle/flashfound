import { supabaseAdmin } from "../clients/supabaseAdmin.js";

export function createNotificationsRepository(client = supabaseAdmin) {
  return {
    async createNotification(payload) {
      const { data, error } = await client.from("notifications").insert(payload).select("*").single();
      if (error) throw error;
      return data;
    },

    async listByRecipient(recipientUserId) {
      const { data, error } = await client
        .from("notifications")
        .select("*")
        .eq("recipient_user_id", recipientUserId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async markRead(notificationId, recipientUserId) {
      const { data, error } = await client
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .eq("recipient_user_id", recipientUserId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async markAllRead(recipientUserId) {
      const { data, error } = await client
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("recipient_user_id", recipientUserId)
        .eq("is_read", false)
        .select("*");
      if (error) throw error;
      return data ?? [];
    },

    async markByPrivateRequestRead(privateAccessRequestId, recipientUserId) {
      const { data, error } = await client
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("private_access_request_id", privateAccessRequestId)
        .eq("recipient_user_id", recipientUserId)
        .select("*");
      if (error) throw error;
      return data ?? [];
    },

    async listAddedToEventByRecipientAndEventIds(recipientUserId, eventIds) {
      if (!eventIds?.length) return [];
      const { data, error } = await client
        .from("notifications")
        .select("id,event_id")
        .eq("recipient_user_id", recipientUserId)
        .eq("type", "added_to_event")
        .in("event_id", eventIds);
      if (error) throw error;
      return data ?? [];
    },
  };
}
