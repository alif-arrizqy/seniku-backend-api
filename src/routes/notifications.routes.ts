import { FastifyInstance } from 'fastify';
import notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

export default async function notificationsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['notifications'],
        description: 'Get all notifications',
        security: [{ sessionCookie: [] }],
      },
    },
    notificationController.getNotifications.bind(notificationController)
  );

  fastify.get(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['notifications'],
        description: 'Get notification by ID',
        security: [{ sessionCookie: [] }],
      },
    },
    notificationController.getNotificationById.bind(notificationController)
  );

  fastify.put(
    '/:id/read',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['notifications'],
        description: 'Mark notification as read',
        security: [{ sessionCookie: [] }],
      },
    },
    notificationController.markAsRead.bind(notificationController)
  );

  fastify.put(
    '/read-all',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['notifications'],
        description: 'Mark all notifications as read',
        security: [{ sessionCookie: [] }],
      },
    },
    notificationController.markAllAsRead.bind(notificationController)
  );

  fastify.get(
    '/unread/count',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['notifications'],
        description: 'Get unread notification count',
        security: [{ sessionCookie: [] }],
      },
    },
    notificationController.getUnreadCount.bind(notificationController)
  );
}

