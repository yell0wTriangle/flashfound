import { supabaseAdmin } from "../clients/supabaseAdmin.js";

export function createMyPhotosRepository(client = supabaseAdmin) {
  return {
    async upsertMyPhotos(userId, photoIds) {
      if (!photoIds.length) return [];

      const rows = photoIds.map((photoId) => ({
        user_id: userId,
        photo_id: photoId,
      }));

      const { data, error } = await client
        .from("my_photos")
        .upsert(rows, { onConflict: "user_id,photo_id" })
        .select("user_id,photo_id,added_at");

      if (error) throw error;
      return data ?? [];
    },

    async getMyPhotoRows(userId) {
      const { data, error } = await client
        .from("my_photos")
        .select("user_id,photo_id,added_at")
        .eq("user_id", userId)
        .order("added_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  };
}

