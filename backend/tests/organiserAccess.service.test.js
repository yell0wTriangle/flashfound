import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/utils/apiError.js";
import { createOrganiserAccessService } from "../src/services/organiserAccessService.js";

function createMockOrganiserRepo(overrides = {}) {
  return {
    findPendingByUserId: vi.fn(),
    createPendingRequest: vi.fn(),
    listRequests: vi.fn(),
    findById: vi.fn(),
    markReviewed: vi.fn(),
    setUserRole: vi.fn(),
    insertAuditLog: vi.fn(),
    ...overrides,
  };
}

function createMockProfileRepo(overrides = {}) {
  return {
    findByIds: vi.fn(),
    ...overrides,
  };
}

describe("organiser access service", () => {
  it("blocks duplicate pending request", async () => {
    const organiserRepo = createMockOrganiserRepo({
      findPendingByUserId: vi.fn().mockResolvedValue({ id: "r1", status: "pending" }),
    });
    const profileRepo = createMockProfileRepo({
      findByIds: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue({ id: "u1", role: "attendee" }),
    });
    const service = createOrganiserAccessService({
      organiserAccessRepository: organiserRepo,
      profileRepository: profileRepo,
    });

    await expect(service.requestAccess("u1")).rejects.toBeInstanceOf(ApiError);
  });

  it("blocks request when user is already organiser", async () => {
    const organiserRepo = createMockOrganiserRepo();
    const profileRepo = createMockProfileRepo({
      findByIds: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue({ id: "u1", role: "organiser" }),
    });
    const service = createOrganiserAccessService({
      organiserAccessRepository: organiserRepo,
      profileRepository: profileRepo,
    });

    await expect(service.requestAccess("u1")).rejects.toBeInstanceOf(ApiError);
    expect(organiserRepo.findPendingByUserId).not.toHaveBeenCalled();
  });

  it("approves pending request and promotes role", async () => {
    const organiserRepo = createMockOrganiserRepo({
      findById: vi.fn().mockResolvedValue({ id: "r1", user_id: "u1", status: "pending" }),
      markReviewed: vi.fn().mockResolvedValue({ id: "r1", status: "approved" }),
      setUserRole: vi.fn().mockResolvedValue({ id: "u1", role: "organiser" }),
      insertAuditLog: vi.fn().mockResolvedValue({ id: "a1" }),
    });
    const service = createOrganiserAccessService({
      organiserAccessRepository: organiserRepo,
      profileRepository: createMockProfileRepo(),
    });

    const result = await service.approveRequest({ requestId: "r1", actor: "admin" });

    expect(result.profile.role).toBe("organiser");
    expect(organiserRepo.insertAuditLog).toHaveBeenCalledTimes(1);
  });

  it("denies pending request without role mutation", async () => {
    const organiserRepo = createMockOrganiserRepo({
      findById: vi.fn().mockResolvedValue({ id: "r1", user_id: "u1", status: "pending" }),
      markReviewed: vi.fn().mockResolvedValue({ id: "r1", status: "denied" }),
      insertAuditLog: vi.fn().mockResolvedValue({ id: "a1" }),
    });
    const service = createOrganiserAccessService({
      organiserAccessRepository: organiserRepo,
      profileRepository: createMockProfileRepo(),
    });

    const result = await service.denyRequest({ requestId: "r1", actor: "admin" });

    expect(result.request.status).toBe("denied");
    expect(organiserRepo.setUserRole).not.toHaveBeenCalled();
  });

  it("searches request list by user email/display_name", async () => {
    const organiserRepo = createMockOrganiserRepo({
      listRequests: vi.fn().mockResolvedValue([
        { id: "r1", user_id: "u1", status: "pending", requested_at: "2026-01-01", reviewed_at: null, reviewed_by: null },
        { id: "r2", user_id: "u2", status: "pending", requested_at: "2026-01-02", reviewed_at: null, reviewed_by: null },
      ]),
    });
    const profileRepo = createMockProfileRepo({
      findByIds: vi.fn().mockResolvedValue([
        { id: "u1", email: "alice@example.com", display_name: "Alice", role: "attendee" },
        { id: "u2", email: "bob@example.com", display_name: "Bob", role: "attendee" },
      ]),
    });
    const service = createOrganiserAccessService({
      organiserAccessRepository: organiserRepo,
      profileRepository: profileRepo,
    });

    const result = await service.listRequests({ q: "alice", status: "pending" });

    expect(result.requests).toHaveLength(1);
    expect(result.requests[0].user.email).toBe("alice@example.com");
  });
});
