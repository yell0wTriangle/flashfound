import crypto from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { createAdminToken } from "../utils/adminToken.js";
import { createOrganiserAccessRepository } from "../repositories/organiserAccessRepository.js";
import { createProfileRepository } from "../repositories/profileRepository.js";

function indexBy(items, key) {
  const map = new Map();
  items.forEach((item) => map.set(item[key], item));
  return map;
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createOrganiserAccessService({
  organiserAccessRepository = createOrganiserAccessRepository(),
  profileRepository = createProfileRepository(),
} = {}) {
  return {
    async requestAccess(userId) {
      const profile = await profileRepository.findById(userId);
      if (!profile) {
        throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
      }
      if (profile.role === "organiser" || profile.role === "admin") {
        throw new ApiError(
          409,
          "ALREADY_ORGANISER",
          "User already has organiser access",
        );
      }

      const pending = await organiserAccessRepository.findPendingByUserId(userId);
      if (pending) {
        throw new ApiError(
          409,
          "REQUEST_ALREADY_PENDING",
          "An organiser access request is already pending",
        );
      }

      const request = await organiserAccessRepository.createPendingRequest(userId);
      return {
        request,
      };
    },

    async adminLogin(accessKey) {
      if (!safeEqual(accessKey, env.ADMIN_ACCESS_KEY)) {
        throw new ApiError(401, "ADMIN_UNAUTHORIZED", "Invalid admin access key");
      }

      return createAdminToken();
    },

    async listRequests({ q, status }) {
      const requests = await organiserAccessRepository.listRequests({ status });
      const userIds = [...new Set(requests.map((request) => request.user_id).filter(Boolean))];
      const profiles = await profileRepository.findByIds(userIds);
      const profilesById = indexBy(profiles, "id");

      const items = requests.map((request) => ({
        id: request.id,
        user_id: request.user_id,
        status: request.status,
        requested_at: request.requested_at,
        reviewed_at: request.reviewed_at,
        reviewed_by: request.reviewed_by,
        user: {
          id: request.user_id,
          email: profilesById.get(request.user_id)?.email || null,
          display_name: profilesById.get(request.user_id)?.display_name || null,
          role: profilesById.get(request.user_id)?.role || null,
        },
      }));

      if (!q) {
        return { requests: items };
      }

      const query = q.toLowerCase();
      const filtered = items.filter((item) => {
        const email = item.user.email?.toLowerCase() || "";
        const displayName = item.user.display_name?.toLowerCase() || "";
        return email.includes(query) || displayName.includes(query);
      });

      return { requests: filtered };
    },

    async approveRequest({ requestId, actor = "admin_key" }) {
      const request = await organiserAccessRepository.findById(requestId);
      if (!request) {
        throw new ApiError(404, "REQUEST_NOT_FOUND", "Organiser request not found");
      }
      if (request.status !== "pending") {
        throw new ApiError(409, "REQUEST_NOT_PENDING", "Request has already been reviewed");
      }

      const reviewedRequest = await organiserAccessRepository.markReviewed({
        requestId,
        nextStatus: "approved",
      });
      const profile = await organiserAccessRepository.setUserRole(request.user_id, "organiser");

      await organiserAccessRepository.insertAuditLog({
        actor,
        action: "organiser_request_approved",
        organiserRequestId: requestId,
        targetUserId: request.user_id,
        metadata: { status: "approved" },
      });

      return {
        request: reviewedRequest,
        profile,
      };
    },

    async denyRequest({ requestId, actor = "admin_key" }) {
      const request = await organiserAccessRepository.findById(requestId);
      if (!request) {
        throw new ApiError(404, "REQUEST_NOT_FOUND", "Organiser request not found");
      }
      if (request.status !== "pending") {
        throw new ApiError(409, "REQUEST_NOT_PENDING", "Request has already been reviewed");
      }

      const reviewedRequest = await organiserAccessRepository.markReviewed({
        requestId,
        nextStatus: "denied",
      });

      await organiserAccessRepository.insertAuditLog({
        actor,
        action: "organiser_request_denied",
        organiserRequestId: requestId,
        targetUserId: request.user_id,
        metadata: { status: "denied" },
      });

      return {
        request: reviewedRequest,
      };
    },
  };
}
