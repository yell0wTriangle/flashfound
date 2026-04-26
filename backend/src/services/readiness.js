import { supabaseAdmin } from "../clients/supabaseAdmin.js";

async function pingSupabase() {
  const { error } = await supabaseAdmin.storage.listBuckets();
  if (error) {
    throw error;
  }
}

export async function checkReadiness({ timeoutMs = 2000, ping = pingSupabase } = {}) {
  const timeoutPromise = new Promise((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error("Supabase readiness check timed out"));
    }, timeoutMs);
  });

  await Promise.race([ping(), timeoutPromise]);
  return {
    status: "ready",
    dependencies: {
      supabase: "up",
    },
  };
}
