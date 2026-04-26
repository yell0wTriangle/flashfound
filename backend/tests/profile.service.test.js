import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/utils/apiError.js";
import { createProfileService } from "../src/services/profileService.js";

function createMockRepo(overrides = {}) {
  return {
    findById: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    ...overrides,
  };
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

    const service = createProfileService(repo);
    const result = await service.bootstrapProfile({
      id: "u1",
      email: "user@example.com",
      user_metadata: {},
    });

    expect(result.created).toBe(true);
    expect(result.onboarding_status).toBe("new");
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it("returns existing profile on bootstrap when already present", async () => {
    const repo = createMockRepo();
    repo.findById.mockResolvedValue({
      id: "u1",
      face_verification_completed: true,
      role: "attendee",
    });
    const service = createProfileService(repo);

    const result = await service.bootstrapProfile({ id: "u1", email: "user@example.com" });

    expect(result.created).toBe(false);
    expect(result.onboarding_status).toBe("ready");
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("maps onboarding status correctly", async () => {
    const repo = createMockRepo();
    const service = createProfileService(repo);

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
    const service = createProfileService(repo);

    await expect(service.patchProfile("u1", { display_name: "Name" })).rejects.toBeInstanceOf(ApiError);
  });
});
