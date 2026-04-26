import { supabaseAdmin } from "../clients/supabaseAdmin.js";

export function createProfileRepository(client = supabaseAdmin) {
  return {
    async findById(userId) {
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },

    async create(profileInput) {
      const { data, error } = await client
        .from("profiles")
        .insert(profileInput)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },

    async updateById(userId, updates) {
      const { data, error } = await client
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },

    async findByIds(userIds) {
      if (!userIds.length) return [];
      const { data, error } = await client
        .from("profiles")
        .select("id,email,display_name,display_avatar_url,role")
        .in("id", userIds);

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  };
}
