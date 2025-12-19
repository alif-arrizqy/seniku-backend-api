import prisma from '../config/database';
import { NotificationType } from '@prisma/client';
import { parsePagination, PaginationResult } from '../utils/pagination';

export interface NotificationFilters {
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
}

export class NotificationService {
  async findNotifications(filters: NotificationFilters, pagination: PaginationResult) {
    const where: any = {
      userId: filters.userId,
    };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async findNotificationById(notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    const notification = await prisma.notification.create({
      data,
    });

    return notification;
  }

  async markAsRead(notificationId: string) {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
      },
    });

    return notification;
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  }

  async deleteNotification(notificationId: string) {
    await prisma.notification.delete({
      where: { id: notificationId },
    });
  }
}

export default new NotificationService();

