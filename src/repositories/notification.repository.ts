import { Notification, Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { toSkipTake, PaginationQuery } from '@utils/pagination';

class NotificationRepository {
  async createForUsers(
    data: Omit<Prisma.NotificationCreateInput, 'recipients'>,
    userIds: string[],
  ): Promise<Notification> {
    return prisma.notification.create({
      data: {
        ...data,
        recipients: { create: userIds.map((userId) => ({ user: { connect: { id: userId } } } )) },
      },
    });
  }

  async findForUser(userId: string, query: PaginationQuery & { unreadOnly?: boolean }) {
    const { skip, take, page, limit } = toSkipTake(query);
    const where: Prisma.UserNotificationWhereInput = {
      userId,
      isArchived: false,
      ...(query.unreadOnly ? { isRead: false } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.userNotification.findMany({
        where,
        include: { notification: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.userNotification.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  countUnread(userId: string): Promise<number> {
    return prisma.userNotification.count({ where: { userId, isRead: false, isArchived: false } });
  }

  async markRead(userNotificationId: string, userId: string): Promise<void> {
    await prisma.userNotification.updateMany({
      where: { id: userNotificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.userNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async archive(userNotificationId: string, userId: string): Promise<void> {
    await prisma.userNotification.updateMany({
      where: { id: userNotificationId, userId },
      data: { isArchived: true, archivedAt: new Date() },
    });
  }

  deleteArchivedOlderThan(date: Date): Promise<Prisma.BatchPayload> {
    return prisma.userNotification.deleteMany({
      where: { isArchived: true, archivedAt: { lt: date } },
    });
  }
}

export const notificationRepository = new NotificationRepository();
