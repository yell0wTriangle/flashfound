import { describe, expect, it, vi } from "vitest";
import { createMyPhotosService } from "../src/services/myPhotosService.js";

function createMyRepo(overrides = {}) {
  return {
    upsertMyPhotos: vi.fn(),
    getMyPhotoRows: vi.fn(),
    ...overrides,
  };
}

function createEventsRepo(overrides = {}) {
  return {
    getPhotosByIds: vi.fn(),
    getAccessibleEventIdsForUser: vi.fn(),
    getPhotoPeopleByPhotoIds: vi.fn(),
    getEventsByIds: vi.fn(),
    getProfilesByIds: vi.fn(),
    ...overrides,
  };
}

describe("my photos service", () => {
  it("adds only photos from accessible events", async () => {
    const myRepo = createMyRepo({
      upsertMyPhotos: vi.fn().mockResolvedValue([{ photo_id: "p1" }]),
    });
    const eventsRepo = createEventsRepo({
      getPhotosByIds: vi.fn().mockResolvedValue([
        { id: "p1", event_id: "e1" },
        { id: "p2", event_id: "e2" },
      ]),
      getAccessibleEventIdsForUser: vi.fn().mockResolvedValue([{ event_id: "e1" }]),
    });

    const service = createMyPhotosService({ myPhotosRepository: myRepo, eventsRepository: eventsRepo });
    const result = await service.addToMyPhotos({
      user: { id: "u1", email: "u@x.com" },
      photoIds: ["p1", "p2"],
    });

    expect(eventsRepo.getPhotosByIds).toHaveBeenCalled();
    expect(myRepo.upsertMyPhotos).toHaveBeenCalledWith("u1", ["p1"]);
    expect(result.photo_ids).toEqual(["p1"]);
  });

  it("returns empty list when user has no saved photos", async () => {
    const myRepo = createMyRepo({
      getMyPhotoRows: vi.fn().mockResolvedValue([]),
    });
    const eventsRepo = createEventsRepo();
    const service = createMyPhotosService({ myPhotosRepository: myRepo, eventsRepository: eventsRepo });

    const result = await service.listMyPhotos({
      user: { id: "u1", email: "u@x.com" },
      eventIdsCsv: "",
      personIdsCsv: "",
    });

    expect(result).toEqual({ photos: [], events: [], people: [] });
  });
});

