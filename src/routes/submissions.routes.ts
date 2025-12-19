import { FastifyInstance } from 'fastify';
import submissionController from '../controllers/submission.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTeacher } from '../middleware/role.middleware';
import multipart from '@fastify/multipart';

export default async function submissionsRoutes(fastify: FastifyInstance) {
  // Register multipart for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  fastify.get(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['submissions'],
        description: 'Get all submissions',
        security: [{ sessionCookie: [] }],
      },
    },
    submissionController.getSubmissions.bind(submissionController)
  );

  fastify.get(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['submissions'],
        description: 'Get submission by ID',
        security: [{ sessionCookie: [] }],
      },
    },
    submissionController.getSubmissionById.bind(submissionController)
  );

  fastify.post(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['submissions'],
        description: 'Create submission (with image upload)',
        security: [{ sessionCookie: [] }],
        consumes: ['multipart/form-data'],
      },
    },
    submissionController.createSubmission.bind(submissionController)
  );

  fastify.put(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['submissions'],
        description: 'Update submission',
        security: [{ sessionCookie: [] }],
      },
    },
    submissionController.updateSubmission.bind(submissionController)
  );

  fastify.post(
    '/:id/grade',
    {
      preHandler: [authenticate, requireTeacher()],
      schema: {
        tags: ['submissions'],
        description: 'Grade submission',
        security: [{ sessionCookie: [] }],
      },
    },
    submissionController.gradeSubmission.bind(submissionController)
  );

  fastify.post(
    '/:id/revision',
    {
      preHandler: [authenticate, requireTeacher()],
      schema: {
        tags: ['submissions'],
        description: 'Return submission for revision',
        security: [{ sessionCookie: [] }],
      },
    },
    submissionController.returnForRevision.bind(submissionController)
  );

  fastify.delete(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['submissions'],
        description: 'Delete submission',
        security: [{ sessionCookie: [] }],
      },
    },
    submissionController.deleteSubmission.bind(submissionController)
  );
}

