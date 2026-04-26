import { ApiError } from "../utils/apiError.js";
import { verifyAdminToken } from "../utils/adminToken.js";

export function adminAuth(req, _res, next) {
  try {
    const authHeader = req.header("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "ADMIN_UNAUTHORIZED", "Missing admin bearer token");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      throw new ApiError(401, "ADMIN_UNAUTHORIZED", "Missing admin bearer token");
    }

    req.admin = verifyAdminToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

