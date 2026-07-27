import { NotificationType } from '@prisma/client';
import { notificationRepository } from '@repositories/notification.repository';
import { PaginationQuery } from '@utils/pagination';
import { emitToUser } from '@socket/ioInstance';
import { SocketEvent } from '@socket/socketEvents.constant';
import { NotFoundError } from '@utils/errors';

export interface DispatchNotificationInput {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  createdBy?: string;
}

/**
 * Single entry point for creating a notification + fanning it out to
 * recipients. Used by the BullMQ processor (async path) and directly by
 * services that need an immediate, synchronous notification (e.g. a
 * moderator action). Realtime push happens over Socket.IO; email/mobile
 * push are separate, additive channels (push-ready).
 */
class NotificationService {
  async dispatch(input: DispatchNotificationInput) {
    if (input.userIds.length === 0) return null;

    const notification = await notificationRepository.createForUsers(
      {
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data as never,
        actionUrl: input.actionUrl,
        createdBy: input.createdBy,
      },
      input.userIds,
    );

    for (const userId of input.userIds) {
      emitToUser(userId, SocketEvent.NOTIFICATION_NEW, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt,
      });
      const unreadCount = await notificationRepository.countUnread(userId);
      emitToUser(userId, SocketEvent.NOTIFICATION_UNREAD_COUNT, { unreadCount });
    }

    return notification;
  }

  listForUser(userId: string, query: PaginationQuery & { unreadOnly?: boolean }) {
    return notificationRepository.findForUser(userId, query);
  }

  getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.countUnread(userId);
  }

  async markRead(userNotificationId: string, userId: string): Promise<void> {
    await notificationRepository.markRead(userNotificationId, userId);
    const unreadCount = await notificationRepository.countUnread(userId);
    emitToUser(userId, SocketEvent.NOTIFICATION_UNREAD_COUNT, { unreadCount });
  }

  async markAllRead(userId: string): Promise<void> {
    await notificationRepository.markAllRead(userId);
    emitToUser(userId, SocketEvent.NOTIFICATION_UNREAD_COUNT, { unreadCount: 0 });
  }

  async archive(userNotificationId: string, userId: string): Promise<void> {
    await notificationRepository.archive(userNotificationId, userId);
  }

  assertExists<T>(value: T | null, resource = 'Notification'): T {
    if (!value) throw new NotFoundError(resource);
    return value;
  }
}

export const notificationService = new NotificationService();
