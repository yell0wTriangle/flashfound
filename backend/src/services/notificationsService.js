import { createNotificationsRepository } from "../repositories/notificationsRepository.js";

export function createNotificationsService(repository = createNotificationsRepository()) {
  return {
    async list({ user }) {
      const notifications = await repository.listByRecipient(user.id);
      return {
        notifications: notifications.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message,
          is_read: item.is_read,
          created_at: item.created_at,
          read_at: item.read_at,
          event_id: item.event_id,
          requester_user_id: item.requester_user_id,
          target_user_id: item.target_user_id,
          private_access_request_id: item.private_access_request_id,
        })),
      };
    },

    async markRead({ user, notificationId }) {
      const notification = await repository.markRead(notificationId, user.id);
      return { notification };
    },

    async markAllRead({ user }) {
      const notifications = await repository.markAllRead(user.id);
      return {
        count: notifications.length,
      };
    },
  };
}

