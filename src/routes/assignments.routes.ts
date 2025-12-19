import { FastifyInstance } from 'fastify';
import assignmentController from '../controllers/assignment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTeacher } from '../middleware/role.middleware';

export default async function assignmentsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['assignments'],
        description: 'Get all assignments',
        security: [{ sessionCookie: [] }],
      },
    },
    assignmentController.getAssignments.bind(assignmentController)
  );

  fastify.get(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['assignments'],
        description: 'Get assignment by ID',
        security: [{ sessionCookie: [] }],
      },
    },
    assignmentController.getAssignmentById.bind(assignmentController)
  );

  fastify.post(
    '/',
    {
      preHandler: [authenticate, requireTeacher()],
      schema: {
        tags: ['assignments'],
        description: 'Create assignment',
        security: [{ sessionCookie: [] }],
      },
    },
    assignmentController.createAssignment.bind(assignmentController)
  );

  fastify.put(
    '/:id',
    {
      preHandler: [authenticate, requireTeacher()],
      schema: {
        tags: ['assignments'],
        description: 'Update assignment',
        security: [{ sessionCookie: [] }],
      },
    },
    assignmentController.updateAssignment.bind(assignmentController)
  );

  fastify.delete(
    '/:id',
    {
      preHandler: [authenticate, requireTeacher()],
      schema: {
        tags: ['assignments'],
        description: 'Delete assignment',
        security: [{ sessionCookie: [] }],
      },
    },
    assignmentController.deleteAssignment.bind(assignmentController)
  );

  fastify.put(
    '/bulk-status',
    {
      preHandler: [authenticate, requireTeacher()],
      schema: {
        tags: ['assignments'],
        description: 'Bulk update assignment status',
        security: [{ sessionCookie: [] }],
      },
    },
    assignmentController.bulkUpdateStatus.bind(assignmentController)
  );

  fastify.delete(
    '/bulk-delete',
    {
      preHandler: [authenticate, requireTeacher()],
      schema: {
        tags: ['assignments'],
        description: 'Bulk delete assignments',
        security: [{ sessionCookie: [] }],
      },
    },
    assignmentController.bulkDelete.bind(assignmentController)
  );
}

