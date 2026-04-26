import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/utils/apiError.js";
import { createOrganiserEventsService } from "../src/services/organiserEventsService.js";

function createMockRepo(overrides = {}) {
  return {
    createEvent: vi.fn(),
    listEventsByOrganiser: vi.fn(),
    getEventById: vi.fn(),
    updateEvent: vi.fn(),
    upsertAttendees: vi.fn(),
    getAttendeesByEventId: vi.fn().mockResolvedValue([]),
    deleteAttendeeById: vi.fn(),
    getAttendeeById: vi.fn(),
    getProfilesByEmails: vi.fn(),
    insertPhotos: vi.fn(),
    deletePhotosByIds: vi.fn(),
    getPhotosByEventId: vi.fn(),
    ...overrides,
  };
}

describe("organiser events service", () => {
  it("allows draft event without mandatory fields", async () => {
    const repo = createMockRepo({
      createEvent: vi.fn().mockResolvedValue({
        id: "e1",
        organiser_user_id: "u1",
        organiser_name: "Org",
        name: null,
        event_date: null,
        location: null,
        organising_company: null,
        cover_image_url: null,
        privacy_type: "private",
        status: "draft",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      }),
    });
    const service = createOrganiserEventsService(repo);
    const result = await service.createEvent({
      user: { id: "u1", email: "u@x.com" },
      profile: { display_name: "Org" },
      payload: { status: "draft" },
    });

    expect(result.event.status).toBe("draft");
  });

  it("requires mandatory fields for publish status", async () => {
    const repo = createMockRepo();
    const service = createOrganiserEventsService(repo);

    await expect(
      service.createEvent({
        user: { id: "u1", email: "u@x.com" },
        profile: { display_name: "Org" },
        payload: { status: "upcoming", name: "X" },
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects update for non-owned event", async () => {
    const repo = createMockRepo({
      getEventById: vi.fn().mockResolvedValue({ id: "e1", organiser_user_id: "u2" }),
    });
    const service = createOrganiserEventsService(repo);

    await expect(
      service.updateEvent({
        user: { id: "u1" },
        eventId: "e1",
        payload: { name: "Updated" },
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("adds attendees with profile user_id mapping", async () => {
    const repo = createMockRepo({
      getEventById: vi.fn().mockResolvedValue({ id: "e1", organiser_user_id: "u1" }),
      getProfilesByEmails: vi.fn().mockResolvedValue([{ id: "u2", email: "x@example.com" }]),
      upsertAttendees: vi.fn().mockResolvedValue([{ id: "a1", email: "x@example.com", user_id: "u2" }]),
    });
    const photoMatchingService = {
      reprocessEventPhotos: vi.fn().mockResolvedValue([]),
    };
    const notificationsRepository = {
      createNotification: vi.fn().mockResolvedValue({}),
    };
    const service = createOrganiserEventsService(
      repo,
      photoMatchingService,
      notificationsRepository,
    );
    const result = await service.addAttendees({
      user: { id: "u1" },
      eventId: "e1",
      emails: ["x@example.com"],
    });

    expect(result.attendees).toHaveLength(1);
    expect(repo.upsertAttendees).toHaveBeenCalledWith([
      { event_id: "e1", email: "x@example.com", user_id: "u2" },
    ]);
    expect(photoMatchingService.reprocessEventPhotos).toHaveBeenCalledWith({
      eventId: "e1",
      photoIds: [],
    });
    expect(notificationsRepository.createNotification).toHaveBeenCalledWith({
      recipient_user_id: "u2",
      type: "added_to_event",
      title: "Added to Event",
      message: "You were added to an event",
      event_id: "e1",
    });
  });

  it("supports bulk photo delete by event ownership", async () => {
    const repo = createMockRepo({
      getEventById: vi.fn().mockResolvedValue({ id: "e1", organiser_user_id: "u1" }),
      getPhotosByEventId: vi.fn().mockResolvedValue([
        { id: "p1", event_id: "e1" },
        { id: "p2", event_id: "e1" },
      ]),
      deletePhotosByIds: vi.fn().mockResolvedValue([{ id: "p1" }, { id: "p2" }]),
    });
    const service = createOrganiserEventsService(repo);
    const result = await service.removePhotos({
      user: { id: "u1" },
      eventId: "e1",
      photoIds: ["p1", "p2", "p3"],
    });

    expect(result.deleted_count).toBe(2);
  });
});
