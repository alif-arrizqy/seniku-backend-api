import { FastifyInstance } from 'fastify';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTeacher } from '../middleware/role.middleware';

export default async function usersRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [authenticate, requireTeacher()],
      schema: {
        tags: ['users'],
        description: 'Get all users',
        security: [{ sessionCookie: [] }],
      },
    },
    userController.getUsers.bind(userController)
  );

  fastify.get(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['users'],
        description: 'Get user by ID',
        security: [{ sessionCookie: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    userController.getUserById.bind(userController)
  );

  fastify.put(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['users'],
        description: 'Update user',
        security: [{ sessionCookie: [] }],
      },
    },
    userController.updateUser.bind(userController)
  );

  fastify.delete(
    '/:id',
    {
      preHandler: [authenticate, requireTeacher()],
      schema: {
        tags: ['users'],
        description: 'Delete user',
        security: [{ sessionCookie: [] }],
      },
    },
    userController.deleteUser.bind(userController)
  );
}

