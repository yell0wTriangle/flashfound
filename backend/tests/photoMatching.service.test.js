import { describe, expect, it, vi } from "vitest";
import { createPhotoMatchingService } from "../src/services/photoMatchingService.js";

function createRepository(overrides = {}) {
  return {
    getProfileById: vi.fn().mockResolvedValue({
      id: "u2",
      email: "tranceportwalker0@gmail.com",
    }),
    getAccessibleEventIdsForUser: vi.fn().mockResolvedValue(["e1"]),
    getPhotosByEventIds: vi.fn().mockResolvedValue([
      {
        id: "p1",
        event_id: "e1",
        face_processing_status: "processed",
        face_processing_error: "UNMATCHED_EVENT_ATTENDEE_FACES",
      },
    ]),
    getPhotoFacesByPhotoIds: vi.fn().mockResolvedValue([
      {
        photo_id: "p1",
        face_index: 0,
        embedding: [0, 0],
      },
    ]),
    deletePhotoPeopleByPhotoId: vi.fn().mockResolvedValue(undefined),
    deletePhotoPeopleForUserByPhotoIds: vi.fn().mockResolvedValue(undefined),
    getAttendeesByEventId: vi.fn().mockResolvedValue([
      {
        user_id: "u2",
        email: "tranceportwalker0@gmail.com",
      },
    ]),
    getProfilesByIds: vi.fn().mockResolvedValue([
      {
        id: "u2",
        verification_face_embedding: [0.2, 0],
        face_verification_completed: true,
      },
    ]),
    getProfilesByEmails: vi.fn().mockResolvedValue([]),
    upsertPhotoPeople: vi.fn().mockResolvedValue([
      {
        photo_id: "p1",
        person_user_id: "u2",
        confidence: 0.8,
      },
    ]),
    updatePhotoProcessing: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe("photo matching service", () => {
  it("rematches newly verified attendees from the stored face index", async () => {
    const repository = createRepository();
    const service = createPhotoMatchingService(repository);

    const result = await service.rematchUserAcrossAccessiblePhotos({
      userId: "u2",
      email: "tranceportwalker0@gmail.com",
    });

    expect(repository.getPhotoFacesByPhotoIds).toHaveBeenCalledWith(["p1"]);
    expect(repository.deletePhotoPeopleForUserByPhotoIds).toHaveBeenCalledWith({
      userId: "u2",
      photoIds: ["p1"],
    });
    expect(repository.upsertPhotoPeople).toHaveBeenCalledWith([
      {
        photo_id: "p1",
        person_user_id: "u2",
        confidence: 0.8,
      },
    ]);
    expect(repository.updatePhotoProcessing).toHaveBeenCalledWith("p1", {
      face_processing_status: "processed",
      face_processing_error: null,
      face_processed_at: expect.any(String),
    });
    expect(result).toEqual({
      rematched_photos: 1,
      matched_photos: 1,
    });
  });

  it("does not let a newly verified user steal another attendee's weak match", async () => {
    const repository = createRepository({
      getProfilesByIds: vi.fn().mockResolvedValue([
        {
          id: "u2",
          verification_face_embedding: [0.56, 0],
          face_verification_completed: true,
        },
        {
          id: "u1",
          verification_face_embedding: [0.45, 0],
          face_verification_completed: true,
        },
      ]),
      getAttendeesByEventId: vi.fn().mockResolvedValue([
        { user_id: "u2", email: "tranceportwalker0@gmail.com" },
        { user_id: "u1", email: "yellowtriangle2004@gmail.com" },
      ]),
    });
    const service = createPhotoMatchingService(repository);

    const result = await service.rematchUserAcrossAccessiblePhotos({
      userId: "u2",
      email: "tranceportwalker0@gmail.com",
    });

    expect(repository.deletePhotoPeopleForUserByPhotoIds).toHaveBeenCalledWith({
      userId: "u2",
      photoIds: ["p1"],
    });
    expect(repository.upsertPhotoPeople).not.toHaveBeenCalled();
    expect(result).toEqual({
      rematched_photos: 1,
      matched_photos: 0,
    });
  });
});
