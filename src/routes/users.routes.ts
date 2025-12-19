import { FastifyInstance } from 'fastify';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTeacher } from '../middleware/role.middleware';

export default async function usersRoutes(fastify: FastifyInstance) {
  // Get all users - Teacher only
  fastify.get('/', { preHandler: [authenticate, requireTeacher()] }, userController.getUsers.bind(userController));

  // Get user by ID - Protected
  fastify.get('/:id', { preHandler: [authenticate] }, userController.getUserById.bind(userController));

  // Update user - Protected
  fastify.put('/:id', { preHandler: [authenticate] }, userController.updateUser.bind(userController));

  // Delete user - Teacher only
  fastify.delete('/:id', { preHandler: [authenticate, requireTeacher()] }, userController.deleteUser.bind(userController));
}

