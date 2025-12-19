import { FastifyRequest, FastifyReply } from 'fastify';
import notificationService from '../services/notification.service';
import { ResponseFormatter } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import { idParamSchema } from '../validators/common.validator';
import { z } from 'zod';
import { handleError } from '../utils/error-handler';

const queryNotificationsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10'),
  isRead: z.string().transform((val) => val === 'true').optional(),
});

export class NotificationController {
  async getNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(reply, 'Unauthorized', 401);
      }

      const query = queryNotificationsSchema.parse(request.query);
      const pagination = parsePagination({ page: query.page, limit: query.limit });

      const filters = {
        userId: request.user.id,
        isRead: query.isRead,
      };

      const { notifications, total } = await notificationService.findNotifications(filters, pagination);
      const unreadCount = await notificationService.getUnreadCount(request.user.id);

      const totalPages = Math.ceil(total / pagination.limit);
      return reply.code(200).send({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          notifications,
          unreadCount,
        },
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      });
    } catch (error: any) {
      return handleError(reply, error, 'Get notifications error', {
        query: request.query,
        userId: request.user?.id,
      });
    }
  }

  async getNotificationById(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(reply, 'Unauthorized', 401);
      }

      const { id } = idParamSchema.parse(request.params);
      const notification = await notificationService.findNotificationById(id);

      // Verify that notification belongs to the current user
      if (notification.userId !== request.user.id) {
        return ResponseFormatter.error(reply, 'Notification not found', 404);
      }

      return ResponseFormatter.success(reply, { notification }, 'Notification retrieved successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Get notification by ID error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }

  async markAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(reply, 'Unauthorized', 401);
      }

      const { id } = idParamSchema.parse(request.params);
      const notification = await notificationService.findNotificationById(id);

      // Verify that notification belongs to the current user
      if (notification.userId !== request.user.id) {
        return ResponseFormatter.error(reply, 'Notification not found', 404);
      }

      const updatedNotification = await notificationService.markAsRead(id);

      return ResponseFormatter.success(reply, { notification: updatedNotification }, 'Notification marked as read');
    } catch (error: any) {
      return handleError(reply, error, 'Mark notification as read error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }

  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(reply, 'Unauthorized', 401);
      }

      await notificationService.markAllAsRead(request.user.id);

      return ResponseFormatter.success(reply, null, 'All notifications marked as read');
    } catch (error: any) {
      return handleError(reply, error, 'Mark all notifications as read error', {
        userId: request.user?.id,
      });
    }
  }

  async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(reply, 'Unauthorized', 401);
      }

      const count = await notificationService.getUnreadCount(request.user.id);

      return ResponseFormatter.success(reply, { count }, 'Unread count retrieved');
    } catch (error: any) {
      return handleError(reply, error, 'Get unread count error', {
        userId: request.user?.id,
      });
    }
  }
}

export default new NotificationController();

