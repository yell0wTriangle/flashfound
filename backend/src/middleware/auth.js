import { ApiError } from "../utils/apiError.js";
import { supabaseAdmin } from "../clients/supabaseAdmin.js";

export async function auth(req, _res, next) {
  try {
    const authHeader = req.header("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "UNAUTHORIZED", "Missing bearer token");
    }

    const accessToken = authHeader.slice("Bearer ".length).trim();
    if (!accessToken) {
      throw new ApiError(401, "UNAUTHORIZED", "Missing bearer token");
    }

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data?.user) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired token");
    }

    req.user = data.user;
    req.accessToken = accessToken;
    next();
  } catch (error) {
    next(error);
  }
}
