import { supabaseAdmin } from "../clients/supabaseAdmin.js";

export function createVerificationRepository(client = supabaseAdmin) {
  return {
    async expireActiveSessions(userId) {
      const now = new Date().toISOString();
      const { data, error } = await client
        .from("face_verification_sessions")
        .update({
          status: "expired",
          updated_at: now,
        })
        .eq("user_id", userId)
        .in("status", ["pending", "submitted"])
        .select("*");
      if (error) throw error;
      return data ?? [];
    },

    async createSession({ userId, expiresAt }) {
      const { data, error } = await client
        .from("face_verification_sessions")
        .insert({
          user_id: userId,
          status: "pending",
          expires_at: expiresAt,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async findSessionById(sessionId) {
      const { data, error } = await client
        .from("face_verification_sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async findLatestNonFinalizedSessionByUserId(userId) {
      const { data, error } = await client
        .from("face_verification_sessions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["pending", "submitted"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async updateSession(sessionId, updates) {
      const { data, error } = await client
        .from("face_verification_sessions")
        .update(updates)
        .eq("id", sessionId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async createAttempt(input) {
      const { data, error } = await client
        .from("face_verification_attempts")
        .insert(input)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  };
}
