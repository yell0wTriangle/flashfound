import { ApiError } from "../utils/apiError.js";
import { createEventsRepository } from "../repositories/eventsRepository.js";
import { createPrivateAccessRepository } from "../repositories/privateAccessRepository.js";
import { createNotificationsRepository } from "../repositories/notificationsRepository.js";
import { createProfileRepository } from "../repositories/profileRepository.js";

export function createPrivateAccessService({
  eventsRepository = createEventsRepository(),
  privateAccessRepository = createPrivateAccessRepository(),
  notificationsRepository = createNotificationsRepository(),
  profileRepository = createProfileRepository(),
} = {}) {
  return {
    async requestAccess({ user, eventId, targetUserId }) {
      if (targetUserId === user.id) {
        throw new ApiError(400, "INVALID_TARGET", "Cannot request access to your own photos");
      }

      const attendeeRows = await eventsRepository.getAccessibleEventIdsForUser({
        userId: user.id,
        email: user.email || "",
      });
      const accessibleEventIds = new Set(attendeeRows.map((row) => row.event_id));
      if (!accessibleEventIds.has(eventId)) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }

      const event = await eventsRepository.getEventById(eventId);
      if (!event || event.privacy_type !== "private") {
        throw new ApiError(400, "NOT_PRIVATE_EVENT", "Access requests are only available for private events");
      }

      const personIds = await eventsRepository.getPersonIdsByEventId(eventId);
      if (!personIds.includes(targetUserId)) {
        throw new ApiError(404, "TARGET_NOT_FOUND", "Target user not found in event context");
      }

      const alreadyGranted = await privateAccessRepository.hasGrant({
        eventId,
        requesterUserId: user.id,
        targetUserId,
      });
      if (alreadyGranted) {
        throw new ApiError(409, "ACCESS_ALREADY_GRANTED", "Access already granted");
      }

      const pending = await privateAccessRepository.findPending({
        eventId,
        requesterUserId: user.id,
        targetUserId,
      });
      if (pending) {
        throw new ApiError(409, "REQUEST_ALREADY_PENDING", "Access request already pending");
      }

      const request = await privateAccessRepository.createRequest({
        eventId,
        requesterUserId: user.id,
        targetUserId,
      });

      const requesterProfile = await profileRepository.findById(user.id);
      const eventName = event.name || "Private Event";
      const requesterName = requesterProfile?.display_name || requesterProfile?.email || "Someone";

      await notificationsRepository.createNotification({
        recipient_user_id: targetUserId,
        type: "private_access_request",
        title: "Photo Access Request",
        message: `${requesterName} requested access in ${eventName}`,
        event_id: eventId,
        requester_user_id: user.id,
        target_user_id: targetUserId,
        private_access_request_id: request.id,
      });

      return { request };
    },

    async approveRequest({ user, requestId }) {
      const request = await privateAccessRepository.findById(requestId);
      if (!request) {
        throw new ApiError(404, "REQUEST_NOT_FOUND", "Access request not found");
      }
      if (request.target_user_id !== user.id) {
        throw new ApiError(403, "FORBIDDEN", "You cannot approve this request");
      }
      if (request.status !== "pending") {
        throw new ApiError(409, "REQUEST_NOT_PENDING", "Request has already been reviewed");
      }

      const grant = await privateAccessRepository.upsertGrant({
        eventId: request.event_id,
        requesterUserId: request.requester_user_id,
        targetUserId: request.target_user_id,
      });
      const reviewed = await privateAccessRepository.updateStatus({
        requestId,
        status: "approved",
      });

      await notificationsRepository.markByPrivateRequestRead(requestId, user.id);

      return {
        request: reviewed,
        grant,
      };
    },

    async denyRequest({ user, requestId }) {
      const request = await privateAccessRepository.findById(requestId);
      if (!request) {
        throw new ApiError(404, "REQUEST_NOT_FOUND", "Access request not found");
      }
      if (request.target_user_id !== user.id) {
        throw new ApiError(403, "FORBIDDEN", "You cannot deny this request");
      }
      if (request.status !== "pending") {
        throw new ApiError(409, "REQUEST_NOT_PENDING", "Request has already been reviewed");
      }

      const reviewed = await privateAccessRepository.updateStatus({
        requestId,
        status: "denied",
      });

      await notificationsRepository.markByPrivateRequestRead(requestId, user.id);

      return {
        request: reviewed,
      };
    },
  };
}

