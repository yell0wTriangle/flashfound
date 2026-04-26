import { supabaseAdmin } from "../clients/supabaseAdmin.js";

export function createOrganiserAccessRepository(client = supabaseAdmin) {
  return {
    async findPendingByUserId(userId) {
      const { data, error } = await client
        .from("organiser_requests")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async createPendingRequest(userId) {
      const { data, error } = await client
        .from("organiser_requests")
        .insert({
          user_id: userId,
          status: "pending",
        })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },

    async listRequests({ status }) {
      let query = client
        .from("organiser_requests")
        .select("id,user_id,status,requested_at,reviewed_at,reviewed_by")
        .order("requested_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },

    async findById(requestId) {
      const { data, error } = await client
        .from("organiser_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async markReviewed({ requestId, nextStatus, reviewedBy = null }) {
      const { data, error } = await client
        .from("organiser_requests")
        .update({
          status: nextStatus,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },

    async setUserRole(userId, role) {
      const { data, error } = await client
        .from("profiles")
        .update({ role })
        .eq("id", userId)
        .select("id,email,display_name,role")
        .single();

      if (error) throw error;
      return data;
    },

    async insertAuditLog({ actor, action, organiserRequestId, targetUserId, metadata }) {
      const { data, error } = await client
        .from("admin_audit_logs")
        .insert({
          actor,
          action,
          organiser_request_id: organiserRequestId,
          target_user_id: targetUserId,
          metadata: metadata || {},
        })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  };
}

