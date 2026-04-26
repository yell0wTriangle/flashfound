import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/utils/apiError.js";
import { createVerificationService } from "../src/services/verificationService.js";

function createVerificationRepo(overrides = {}) {
  return {
    expireActiveSessions: vi.fn().mockResolvedValue([]),
    createSession: vi.fn(),
    findSessionById: vi.fn(),
    updateSession: vi.fn(),
    createAttempt: vi.fn(),
    ...overrides,
  };
}

function createProfileRepo(overrides = {}) {
  return {
    findById: vi.fn(),
    updateById: vi.fn(),
    ...overrides,
  };
}

describe("verification service", () => {
  it("starts session for existing profile", async () => {
    const verificationRepo = createVerificationRepo({
      createSession: vi.fn().mockResolvedValue({ id: "s1", status: "pending" }),
    });
    const profileRepo = createProfileRepo({
      findById: vi.fn().mockResolvedValue({ id: "u1" }),
    });

    const service = createVerificationService({
      verificationRepository: verificationRepo,
      profileRepository: profileRepo,
      faceVerifier: { verifySelfieFromUrl: vi.fn() },
    });

    const result = await service.startSession({ userId: "u1" });
    expect(result.session.id).toBe("s1");
    expect(verificationRepo.expireActiveSessions).toHaveBeenCalledWith("u1");
  });

  it("rejects finalize before submit", async () => {
    const verificationRepo = createVerificationRepo({
      findSessionById: vi.fn().mockResolvedValue({
        id: "s1",
        user_id: "u1",
        status: "pending",
        expires_at: new Date(Date.now() + 60000).toISOString(),
      }),
    });
    const service = createVerificationService({
      verificationRepository: verificationRepo,
      profileRepository: createProfileRepo(),
      faceVerifier: { verifySelfieFromUrl: vi.fn() },
    });

    await expect(service.finalizeSession({ userId: "u1", sessionId: "s1" })).rejects.toBeInstanceOf(ApiError);
  });

  it("submits selfie and transitions session to submitted on pass", async () => {
    const verificationRepo = createVerificationRepo({
      findSessionById: vi.fn().mockResolvedValue({
        id: "s1",
        user_id: "u1",
        status: "pending",
        expires_at: new Date(Date.now() + 60000).toISOString(),
      }),
      updateSession: vi.fn().mockResolvedValue({
        id: "s1",
        user_id: "u1",
        status: "submitted",
      }),
    });

    const service = createVerificationService({
      verificationRepository: verificationRepo,
      profileRepository: createProfileRepo(),
      faceVerifier: {
        verifySelfieFromUrl: vi.fn().mockResolvedValue({
          passed: true,
          failure_code: null,
          face_count: 1,
          quality_score: 0.9,
        }),
      },
    });

    const result = await service.submitSession({
      userId: "u1",
      sessionId: "s1",
      selfieUrl: "https://example.com/selfie.jpg",
    });

    expect(result.result.passed).toBe(true);
    expect(verificationRepo.createAttempt).toHaveBeenCalledTimes(1);
  });
});
