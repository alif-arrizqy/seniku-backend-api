import { FastifyInstance } from 'fastify';
import notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

export default async function notificationsRoutes(fastify: FastifyInstance) {
  // Get all notifications - Protected
  fastify.get('/', { preHandler: [authenticate] }, notificationController.getNotifications.bind(notificationController));

  // Get notification by ID - Protected
  fastify.get('/:id', { preHandler: [authenticate] }, notificationController.getNotificationById.bind(notificationController));

  // Mark notification as read - Protected
  fastify.put('/:id/read', { preHandler: [authenticate] }, notificationController.markAsRead.bind(notificationController));

  // Mark all notifications as read - Protected
  fastify.put('/read-all', { preHandler: [authenticate] }, notificationController.markAllAsRead.bind(notificationController));

  // Get unread notification count - Protected
  fastify.get('/unread/count', { preHandler: [authenticate] }, notificationController.getUnreadCount.bind(notificationController));
}

