import { describe, expect, it } from "vitest";
import { createNotificationsService } from "../src/services/notificationsService.js";
import { createOrganiserAccessService } from "../src/services/organiserAccessService.js";
import { createPrivateAccessService } from "../src/services/privateAccessService.js";
import { createProfileService } from "../src/services/profileService.js";

describe("phase6 critical flows integration", () => {
  it("covers onboarding status progression", async () => {
    const state = {
      profile: null,
    };
    const profileRepo = {
      async findById() {
        return state.profile;
      },
      async create(input) {
        state.profile = {
          ...input,
          face_verification_completed: false,
          role: "attendee",
        };
        return state.profile;
      },
      async updateById(_id, updates) {
        state.profile = { ...state.profile, ...updates };
        return state.profile;
      },
    };
    const service = createProfileService(profileRepo);

    const bootstrap = await service.bootstrapProfile({
      id: "u1",
      email: "user@example.com",
      user_metadata: {},
    });
    expect(bootstrap.onboarding_status).toBe("new");

    const needsSelfie = await service.getOnboardingStatus("u1");
    expect(needsSelfie.status).toBe("needs_selfie");

    state.profile = {
      ...state.profile,
      verification_selfie_url: "https://img.example.com/selfie.jpg",
      face_verification_completed: true,
    };
    const ready = await service.getOnboardingStatus("u1");
    expect(ready.status).toBe("ready");
  });

  it("covers organiser request and approval lifecycle", async () => {
    const profiles = new Map([
      ["u1", { id: "u1", email: "user@example.com", display_name: "User", role: "attendee" }],
    ]);
    const requests = [];

    const organiserRepo = {
      async findPendingByUserId(userId) {
        return requests.find((request) => request.user_id === userId && request.status === "pending") || null;
      },
      async createPendingRequest(userId) {
        const request = {
          id: "r1",
          user_id: userId,
          status: "pending",
          requested_at: new Date().toISOString(),
          reviewed_at: null,
          reviewed_by: null,
        };
        requests.push(request);
        return request;
      },
      async listRequests() {
        return requests;
      },
      async findById(id) {
        return requests.find((request) => request.id === id) || null;
      },
      async markReviewed({ requestId, nextStatus }) {
        const request = requests.find((item) => item.id === requestId);
        request.status = nextStatus;
        request.reviewed_at = new Date().toISOString();
        return request;
      },
      async setUserRole(userId, role) {
        const profile = profiles.get(userId);
        profile.role = role;
        return profile;
      },
      async insertAuditLog() {
        return { id: "audit1" };
      },
    };
    const profileRepo = {
      async findById(id) {
        return profiles.get(id) || null;
      },
      async findByIds(ids) {
        return ids.map((id) => profiles.get(id)).filter(Boolean);
      },
    };

    const service = createOrganiserAccessService({
      organiserAccessRepository: organiserRepo,
      profileRepository: profileRepo,
    });

    const created = await service.requestAccess("u1");
    expect(created.request.status).toBe("pending");

    const approved = await service.approveRequest({ requestId: "r1", actor: "admin_key" });
    expect(approved.request.status).toBe("approved");
    expect(approved.profile.role).toBe("organiser");
  });

  it("covers private access request approve and notification read actions", async () => {
    const requestState = [];
    const grantState = [];
    const notificationState = [];

    const privateAccessService = createPrivateAccessService({
      eventsRepository: {
        async getAccessibleEventIdsForUser() {
          return [{ event_id: "e1" }];
        },
        async getEventById() {
          return { id: "e1", name: "Private Event", privacy_type: "private" };
        },
        async getPersonIdsByEventId() {
          return ["u2"];
        },
      },
      privateAccessRepository: {
        async hasGrant({ eventId, requesterUserId, targetUserId }) {
          return grantState.some(
            (item) =>
              item.event_id === eventId &&
              item.requester_user_id === requesterUserId &&
              item.target_user_id === targetUserId,
          );
        },
        async findPending({ eventId, requesterUserId, targetUserId }) {
          return (
            requestState.find(
              (item) =>
                item.event_id === eventId &&
                item.requester_user_id === requesterUserId &&
                item.target_user_id === targetUserId &&
                item.status === "pending",
            ) || null
          );
        },
        async createRequest({ eventId, requesterUserId, targetUserId }) {
          const request = {
            id: "pr1",
            event_id: eventId,
            requester_user_id: requesterUserId,
            target_user_id: targetUserId,
            status: "pending",
          };
          requestState.push(request);
          return request;
        },
        async findById(id) {
          return requestState.find((item) => item.id === id) || null;
        },
        async upsertGrant({ eventId, requesterUserId, targetUserId }) {
          const grant = { event_id: eventId, requester_user_id: requesterUserId, target_user_id: targetUserId };
          grantState.push(grant);
          return grant;
        },
        async updateStatus({ requestId, status }) {
          const request = requestState.find((item) => item.id === requestId);
          request.status = status;
          return request;
        },
      },
      notificationsRepository: {
        async createNotification(payload) {
          const notification = {
            id: "n1",
            is_read: false,
            read_at: null,
            created_at: new Date().toISOString(),
            ...payload,
          };
          notificationState.push(notification);
          return notification;
        },
        async markByPrivateRequestRead(privateAccessRequestId, recipientUserId) {
          notificationState
            .filter(
              (item) =>
                item.private_access_request_id === privateAccessRequestId &&
                item.recipient_user_id === recipientUserId,
            )
            .forEach((item) => {
              item.is_read = true;
              item.read_at = new Date().toISOString();
            });
          return notificationState;
        },
      },
      profileRepository: {
        async findById() {
          return { id: "u1", display_name: "Requester", email: "u1@example.com" };
        },
      },
    });

    const notificationsService = createNotificationsService({
      async listByRecipient(recipientUserId) {
        return notificationState.filter((item) => item.recipient_user_id === recipientUserId);
      },
      async markRead(notificationId, recipientUserId) {
        const item = notificationState.find(
          (notification) => notification.id === notificationId && notification.recipient_user_id === recipientUserId,
        );
        item.is_read = true;
        item.read_at = new Date().toISOString();
        return item;
      },
      async markAllRead(recipientUserId) {
        const items = notificationState.filter((item) => item.recipient_user_id === recipientUserId);
        items.forEach((item) => {
          item.is_read = true;
          item.read_at = new Date().toISOString();
        });
        return items;
      },
    });

    const requested = await privateAccessService.requestAccess({
      user: { id: "u1", email: "u1@example.com" },
      eventId: "e1",
      targetUserId: "u2",
    });
    expect(requested.request.status).toBe("pending");

    const listed = await notificationsService.list({ user: { id: "u2" } });
    expect(listed.notifications).toHaveLength(1);

    const approved = await privateAccessService.approveRequest({
      user: { id: "u2" },
      requestId: "pr1",
    });
    expect(approved.request.status).toBe("approved");

    const markAll = await notificationsService.markAllRead({ user: { id: "u2" } });
    expect(markAll.count).toBeGreaterThanOrEqual(1);
  });
});
