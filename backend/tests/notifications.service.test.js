import { describe, expect, it, vi } from "vitest";
import { createNotificationsService } from "../src/services/notificationsService.js";

function createRepository(overrides = {}) {
  return {
    listByRecipient: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    ...overrides,
  };
}

describe("notifications service", () => {
  it("lists notifications for current user", async () => {
    const repository = createRepository({
      listByRecipient: vi.fn().mockResolvedValue([
        {
          id: "n1",
          type: "added_to_event",
          title: "Added",
          message: "You were added",
          is_read: false,
          created_at: "2026-01-01T00:00:00Z",
          read_at: null,
          event_id: "e1",
          requester_user_id: null,
          target_user_id: null,
          private_access_request_id: null,
        },
      ]),
    });
    const service = createNotificationsService(repository);

    const result = await service.list({
      user: { id: "u1" },
    });

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].id).toBe("n1");
  });

  it("marks all notifications as read and returns count", async () => {
    const repository = createRepository({
      markAllRead: vi.fn().mockResolvedValue([{ id: "n1" }, { id: "n2" }]),
    });
    const service = createNotificationsService(repository);

    const result = await service.markAllRead({
      user: { id: "u1" },
    });

    expect(result.count).toBe(2);
  });
});
