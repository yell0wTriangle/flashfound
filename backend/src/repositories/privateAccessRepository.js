import { supabaseAdmin } from "../clients/supabaseAdmin.js";

export function createPrivateAccessRepository(client = supabaseAdmin) {
  return {
    async findPending({ eventId, requesterUserId, targetUserId }) {
      const { data, error } = await client
        .from("private_access_requests")
        .select("*")
        .eq("event_id", eventId)
        .eq("requester_user_id", requesterUserId)
        .eq("target_user_id", targetUserId)
        .eq("status", "pending")
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async createRequest({ eventId, requesterUserId, targetUserId }) {
      const { data, error } = await client
        .from("private_access_requests")
        .insert({
          event_id: eventId,
          requester_user_id: requesterUserId,
          target_user_id: targetUserId,
          status: "pending",
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async findById(requestId) {
      const { data, error } = await client
        .from("private_access_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async updateStatus({ requestId, status }) {
      const { data, error } = await client
        .from("private_access_requests")
        .update({
          status,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async upsertGrant({ eventId, requesterUserId, targetUserId }) {
      const { data, error } = await client
        .from("private_access_grants")
        .upsert(
          {
            event_id: eventId,
            requester_user_id: requesterUserId,
            target_user_id: targetUserId,
          },
          { onConflict: "event_id,requester_user_id,target_user_id" },
        )
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async hasGrant({ eventId, requesterUserId, targetUserId }) {
      const { data, error } = await client
        .from("private_access_grants")
        .select("event_id")
        .eq("event_id", eventId)
        .eq("requester_user_id", requesterUserId)
        .eq("target_user_id", targetUserId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  };
}

