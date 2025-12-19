import { FastifyInstance } from 'fastify';
import classController from '../controllers/class.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTeacher } from '../middleware/role.middleware';

export default async function classesRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['classes'],
        description: 'Get all classes',
        security: [{ sessionCookie: [] }],
      },
    },
    classController.getClasses.bind(classController)
  );

  fastify.get(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['classes'],
        description: 'Get class by ID',
        security: [{ sessionCookie: [] }],
      },
    },
    classController.getClassById.bind(classController)
  );

  fastify.post(
    '/',
    {
      preHandler: [authenticate, requireTeacher()],
      schema: {
        tags: ['classes'],
        description: 'Create class',
        security: [{ sessionCookie: [] }],
      },
    },
    classController.createClass.bind(classController)
  );

  fastify.put(
    '/:id',
    {
      preHandler: [authenticate, requireTeacher()],
      schema: {
        tags: ['classes'],
        description: 'Update class',
        security: [{ sessionCookie: [] }],
      },
    },
    classController.updateClass.bind(classController)
  );

  fastify.delete(
    '/:id',
    {
      preHandler: [authenticate, requireTeacher()],
      schema: {
        tags: ['classes'],
        description: 'Delete class',
        security: [{ sessionCookie: [] }],
      },
    },
    classController.deleteClass.bind(classController)
  );
}

