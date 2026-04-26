import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/utils/apiError.js";
import { createEventsService } from "../src/services/eventsService.js";

function createMockRepository(overrides = {}) {
  return {
    getAccessibleEventIdsForUser: vi.fn(),
    getEventsByIds: vi.fn(),
    getEventById: vi.fn(),
    getPhotosByEventId: vi.fn(),
    getPhotoPeopleByPhotoIds: vi.fn(),
    getProfilesByIds: vi.fn(),
    getPhotosByIds: vi.fn(),
    getPrivateAccessGrantedTargets: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("events service", () => {
  it("returns empty discovery when no accessible events", async () => {
    const repo = createMockRepository({
      getAccessibleEventIdsForUser: vi.fn().mockResolvedValue([]),
    });
    const service = createEventsService(repo);
    const result = await service.discovery({
      user: { id: "u1", email: "u@x.com" },
      search: "",
      privacyType: "all",
    });

    expect(result).toEqual({ events: [] });
  });

  it("rejects event people for inaccessible event", async () => {
    const repo = createMockRepository({
      getAccessibleEventIdsForUser: vi.fn().mockResolvedValue([{ event_id: "e2" }]),
    });
    const service = createEventsService(repo);

    await expect(
      service.eventPeople({ user: { id: "u1", email: "u@x.com" }, eventId: "e1" }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("filters private event results to self when no people filter", async () => {
    const repo = createMockRepository({
      getAccessibleEventIdsForUser: vi.fn().mockResolvedValue([{ event_id: "e1" }]),
      getEventById: vi.fn().mockResolvedValue({ id: "e1", privacy_type: "private", name: "E1", event_date: "2026-01-01", location: "x", organiser_name: "o", organising_company: null, cover_image_url: null, status: "upcoming", created_at: "2026-01-01T00:00:00Z" }),
      getPhotosByEventId: vi.fn().mockResolvedValue([
        { id: "p1", event_id: "e1", storage_path: "a", image_url: null, created_at: "2026-01-01T00:00:00Z" },
        { id: "p2", event_id: "e1", storage_path: "b", image_url: null, created_at: "2026-01-01T00:00:00Z" },
      ]),
      getPhotoPeopleByPhotoIds: vi.fn().mockResolvedValue([
        { photo_id: "p1", person_user_id: "u1" },
        { photo_id: "p2", person_user_id: "u2" },
      ]),
      getProfilesByIds: vi.fn().mockResolvedValue([{ id: "u1", display_name: "Me", display_avatar_url: null }, { id: "u2", display_name: "Other", display_avatar_url: null }]),
    });
    const service = createEventsService(repo);

    const result = await service.eventResults({
      user: { id: "u1", email: "u@x.com" },
      eventId: "e1",
      personIdsCsv: "",
    });

    expect(result.photos.map((photo) => photo.id)).toEqual(["p1"]);
  });

  it("marks granted user as accessible in private event people", async () => {
    const repo = createMockRepository({
      getAccessibleEventIdsForUser: vi.fn().mockResolvedValue([{ event_id: "e1" }]),
      getEventById: vi.fn().mockResolvedValue({
        id: "e1",
        privacy_type: "private",
        name: "E1",
        event_date: "2026-01-01",
        location: "x",
        organiser_name: "o",
        organising_company: null,
        cover_image_url: null,
        status: "upcoming",
        created_at: "2026-01-01T00:00:00Z",
      }),
      getPhotosByEventId: vi.fn().mockResolvedValue([
        { id: "p1", event_id: "e1", storage_path: "a", image_url: null, created_at: "2026-01-01T00:00:00Z" },
      ]),
      getPhotoPeopleByPhotoIds: vi.fn().mockResolvedValue([
        { photo_id: "p1", person_user_id: "u1" },
        { photo_id: "p1", person_user_id: "u2" },
      ]),
      getProfilesByIds: vi.fn().mockResolvedValue([
        { id: "u1", display_name: "Me", display_avatar_url: null },
        { id: "u2", display_name: "Granted", display_avatar_url: null },
      ]),
      getPrivateAccessGrantedTargets: vi.fn().mockResolvedValue(["u2"]),
    });
    const service = createEventsService(repo);

    const result = await service.eventPeople({
      user: { id: "u1", email: "u@x.com" },
      eventId: "e1",
    });

    const me = result.people.find((person) => person.id === "u1");
    const granted = result.people.find((person) => person.id === "u2");
    expect(me?.accessible).toBe(true);
    expect(granted?.accessible).toBe(true);
  });

  it("includes granted person's photos in private event results when selected", async () => {
    const repo = createMockRepository({
      getAccessibleEventIdsForUser: vi.fn().mockResolvedValue([{ event_id: "e1" }]),
      getEventById: vi.fn().mockResolvedValue({
        id: "e1",
        privacy_type: "private",
        name: "E1",
        event_date: "2026-01-01",
        location: "x",
        organiser_name: "o",
        organising_company: null,
        cover_image_url: null,
        status: "upcoming",
        created_at: "2026-01-01T00:00:00Z",
      }),
      getPhotosByEventId: vi.fn().mockResolvedValue([
        { id: "p1", event_id: "e1", storage_path: "a", image_url: null, created_at: "2026-01-01T00:00:00Z" },
        { id: "p2", event_id: "e1", storage_path: "b", image_url: null, created_at: "2026-01-01T00:00:00Z" },
      ]),
      getPhotoPeopleByPhotoIds: vi.fn().mockResolvedValue([
        { photo_id: "p1", person_user_id: "u1" },
        { photo_id: "p2", person_user_id: "u2" },
      ]),
      getProfilesByIds: vi.fn().mockResolvedValue([
        { id: "u1", display_name: "Me", display_avatar_url: null },
        { id: "u2", display_name: "Granted", display_avatar_url: null },
      ]),
      getPrivateAccessGrantedTargets: vi.fn().mockResolvedValue(["u2"]),
    });
    const service = createEventsService(repo);

    const result = await service.eventResults({
      user: { id: "u1", email: "u@x.com" },
      eventId: "e1",
      personIdsCsv: "u2",
    });

    expect(result.photos.map((photo) => photo.id)).toEqual(["p2"]);
  });

  it("hides photos that are blocked by face-processing privacy rules", async () => {
    const repo = createMockRepository({
      getAccessibleEventIdsForUser: vi.fn().mockResolvedValue([{ event_id: "e1" }]),
      getEventById: vi.fn().mockResolvedValue({
        id: "e1",
        privacy_type: "public",
        name: "E1",
        event_date: "2026-01-01",
        location: "x",
        organiser_name: "o",
        organising_company: null,
        cover_image_url: null,
        status: "upcoming",
        created_at: "2026-01-01T00:00:00Z",
      }),
      getPhotosByEventId: vi.fn().mockResolvedValue([
        {
          id: "p1",
          event_id: "e1",
          storage_path: "a",
          image_url: null,
          created_at: "2026-01-01T00:00:00Z",
          face_processing_status: "processed",
          face_processing_error: null,
        },
        {
          id: "p2",
          event_id: "e1",
          storage_path: "b",
          image_url: null,
          created_at: "2026-01-01T00:00:00Z",
          face_processing_status: "processed",
          face_processing_error: "UNMATCHED_EVENT_ATTENDEE_FACES",
        },
      ]),
      getPhotoPeopleByPhotoIds: vi.fn().mockResolvedValue([
        { photo_id: "p1", person_user_id: "u1" },
      ]),
      getProfilesByIds: vi.fn().mockResolvedValue([
        { id: "u1", display_name: "Me", display_avatar_url: null },
      ]),
    });
    const service = createEventsService(repo);

    const result = await service.eventResults({
      user: { id: "u1", email: "u@x.com" },
      eventId: "e1",
      personIdsCsv: "",
    });

    expect(result.photos.map((photo) => photo.id)).toEqual(["p1"]);
  });
});
