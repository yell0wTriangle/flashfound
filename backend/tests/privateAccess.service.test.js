import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/utils/apiError.js";
import { createPrivateAccessService } from "../src/services/privateAccessService.js";

function createEventsRepository(overrides = {}) {
  return {
    getAccessibleEventIdsForUser: vi.fn(),
    getEventById: vi.fn(),
    getPersonIdsByEventId: vi.fn(),
    ...overrides,
  };
}

function createPrivateAccessRepository(overrides = {}) {
  return {
    hasGrant: vi.fn().mockResolvedValue(false),
    findPending: vi.fn().mockResolvedValue(null),
    createRequest: vi.fn(),
    findById: vi.fn(),
    upsertGrant: vi.fn(),
    updateStatus: vi.fn(),
    ...overrides,
  };
}

function createNotificationsRepository(overrides = {}) {
  return {
    createNotification: vi.fn(),
    markByPrivateRequestRead: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function createProfileRepository(overrides = {}) {
  return {
    findById: vi.fn(),
    ...overrides,
  };
}

describe("private access service", () => {
  it("creates a private access request and notification", async () => {
    const eventsRepository = createEventsRepository({
      getAccessibleEventIdsForUser: vi.fn().mockResolvedValue([{ event_id: "e1" }]),
      getEventById: vi.fn().mockResolvedValue({ id: "e1", name: "Private E1", privacy_type: "private" }),
      getPersonIdsByEventId: vi.fn().mockResolvedValue(["u2"]),
    });
    const privateAccessRepository = createPrivateAccessRepository({
      createRequest: vi.fn().mockResolvedValue({
        id: "r1",
        event_id: "e1",
        requester_user_id: "u1",
        target_user_id: "u2",
        status: "pending",
      }),
    });
    const notificationsRepository = createNotificationsRepository();
    const profileRepository = createProfileRepository({
      findById: vi.fn().mockResolvedValue({ id: "u1", display_name: "Alice" }),
    });
    const service = createPrivateAccessService({
      eventsRepository,
      privateAccessRepository,
      notificationsRepository,
      profileRepository,
    });

    const result = await service.requestAccess({
      user: { id: "u1", email: "alice@example.com" },
      eventId: "e1",
      targetUserId: "u2",
    });

    expect(result.request.id).toBe("r1");
    expect(notificationsRepository.createNotification).toHaveBeenCalledTimes(1);
  });

  it("blocks duplicate pending requests", async () => {
    const eventsRepository = createEventsRepository({
      getAccessibleEventIdsForUser: vi.fn().mockResolvedValue([{ event_id: "e1" }]),
      getEventById: vi.fn().mockResolvedValue({ id: "e1", name: "Private E1", privacy_type: "private" }),
      getPersonIdsByEventId: vi.fn().mockResolvedValue(["u2"]),
    });
    const privateAccessRepository = createPrivateAccessRepository({
      findPending: vi.fn().mockResolvedValue({ id: "r-existing", status: "pending" }),
    });
    const service = createPrivateAccessService({
      eventsRepository,
      privateAccessRepository,
      notificationsRepository: createNotificationsRepository(),
      profileRepository: createProfileRepository({ findById: vi.fn().mockResolvedValue({ id: "u1" }) }),
    });

    await expect(
      service.requestAccess({
        user: { id: "u1", email: "alice@example.com" },
        eventId: "e1",
        targetUserId: "u2",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("approves a pending request and creates grant", async () => {
    const privateAccessRepository = createPrivateAccessRepository({
      findById: vi.fn().mockResolvedValue({
        id: "r1",
        event_id: "e1",
        requester_user_id: "u1",
        target_user_id: "u2",
        status: "pending",
      }),
      upsertGrant: vi.fn().mockResolvedValue({
        event_id: "e1",
        requester_user_id: "u1",
        target_user_id: "u2",
      }),
      updateStatus: vi.fn().mockResolvedValue({
        id: "r1",
        status: "approved",
      }),
    });
    const notificationsRepository = createNotificationsRepository();
    const service = createPrivateAccessService({
      eventsRepository: createEventsRepository(),
      privateAccessRepository,
      notificationsRepository,
      profileRepository: createProfileRepository(),
    });

    const result = await service.approveRequest({
      user: { id: "u2" },
      requestId: "r1",
    });

    expect(result.request.status).toBe("approved");
    expect(result.grant.target_user_id).toBe("u2");
    expect(notificationsRepository.markByPrivateRequestRead).toHaveBeenCalledWith("r1", "u2");
  });
});
