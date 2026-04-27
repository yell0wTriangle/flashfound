import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/utils/apiError.js";
import { createProfileService } from "../src/services/profileService.js";

function createMockRepo(overrides = {}) {
  return {
    findById: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    linkAttendeeRowsToUserByEmail: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function createService(repo, overrides = {}) {
  const notificationsRepository = {
    createNotification: vi.fn().mockResolvedValue({}),
    listAddedToEventByRecipientAndEventIds: vi.fn().mockResolvedValue([]),
    ...(overrides.notificationsRepository || {}),
  };
  const eventsRepository = {
    getAccessibleEventIdsForUser: vi.fn().mockResolvedValue([]),
    getEventsByIds: vi.fn().mockResolvedValue([]),
    ...(overrides.eventsRepository || {}),
  };
  return createProfileService(
    repo,
    undefined,
    overrides.photoMatchingService,
    notificationsRepository,
    eventsRepository,
  );
}

describe("profile service", () => {
  it("creates a new profile on bootstrap when missing", async () => {
    const repo = createMockRepo();
    repo.findById.mockResolvedValue(null);
    repo.create.mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      display_name: "user",
      face_verification_completed: false,
      role: "attendee",
    });

    const service = createService(repo);
    const result = await service.bootstrapProfile({
      id: "u1",
      email: "user@example.com",
      user_metadata: {},
    });

    expect(result.created).toBe(true);
    expect(result.onboarding_status).toBe("new");
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.linkAttendeeRowsToUserByEmail).toHaveBeenCalledWith({
      userId: "u1",
      email: "user@example.com",
    });
  });

  it("returns existing profile on bootstrap when already present", async () => {
    const repo = createMockRepo();
    repo.findById.mockResolvedValue({
      id: "u1",
      face_verification_completed: true,
      role: "attendee",
    });
    const service = createService(repo);

    const result = await service.bootstrapProfile({ id: "u1", email: "user@example.com" });

    expect(result.created).toBe(false);
    expect(result.onboarding_status).toBe("ready");
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.linkAttendeeRowsToUserByEmail).toHaveBeenCalledWith({
      userId: "u1",
      email: "user@example.com",
    });
  });

  it("waits for verified profile rematch during bootstrap", async () => {
    const repo = createMockRepo();
    repo.findById.mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      face_verification_completed: true,
      role: "attendee",
    });
    let rematchFinished = false;
    const photoMatchingService = {
      rematchUserAcrossAccessiblePhotos: vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        rematchFinished = true;
        return { rematched_photos: 1, matched_photos: 1 };
      }),
    };
    const service = createService(repo, { photoMatchingService });

    await service.bootstrapProfile({ id: "u1", email: "user@example.com" });

    expect(photoMatchingService.rematchUserAcrossAccessiblePhotos).toHaveBeenCalledWith({
      userId: "u1",
      email: "user@example.com",
    });
    expect(rematchFinished).toBe(true);
  });

  it("maps onboarding status correctly", async () => {
    const repo = createMockRepo();
    const service = createService(repo);

    repo.findById.mockResolvedValueOnce(null);
    await expect(service.getOnboardingStatus("u1")).resolves.toEqual({
      status: "new",
      role: "attendee",
      profile_exists: false,
      verification_session: null,
    });

    repo.findById.mockResolvedValueOnce({
      id: "u1",
      face_verification_completed: false,
      role: "attendee",
    });
    await expect(service.getOnboardingStatus("u1")).resolves.toEqual({
      status: "needs_selfie",
      role: "attendee",
      profile_exists: true,
      verification_session: null,
    });
  });

  it("throws profile not found when patching absent profile", async () => {
    const repo = createMockRepo();
    repo.findById.mockResolvedValue(null);
    const service = createService(repo);

    await expect(service.patchProfile("u1", { display_name: "Name" })).rejects.toBeInstanceOf(ApiError);
  });

  it("creates missing added-to-event notifications during bootstrap", async () => {
    const repo = createMockRepo({
      findById: vi.fn().mockResolvedValue({
        id: "u1",
        email: "user@example.com",
        face_verification_completed: true,
        role: "attendee",
      }),
    });
    const notificationsRepository = {
      createNotification: vi.fn().mockResolvedValue({}),
      listAddedToEventByRecipientAndEventIds: vi.fn().mockResolvedValue([]),
    };
    const eventsRepository = {
      getAccessibleEventIdsForUser: vi.fn().mockResolvedValue([{ event_id: "e1" }]),
      getEventsByIds: vi.fn().mockResolvedValue([{ id: "e1", name: "Demo Event" }]),
    };
    const service = createService(repo, { notificationsRepository, eventsRepository });

    await service.bootstrapProfile({ id: "u1", email: "user@example.com" });

    expect(notificationsRepository.createNotification).toHaveBeenCalledWith({
      recipient_user_id: "u1",
      type: "added_to_event",
      title: "Added to Event",
      message: "You were added to Demo Event",
      event_id: "e1",
    });
  });
});
