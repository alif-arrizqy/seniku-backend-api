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
      fieldSize: 1024 * 1024, // 1MB for fields
      fields: 10, // Maximum number of fields
      files: 10, // Allow multiple files (though we only use first one)
    },
    attachFieldsToBody: false, // Keep default behavior - parse fields manually
  });

  // Get all submissions - Protected
  fastify.get('/', { preHandler: [authenticate] }, submissionController.getSubmissions.bind(submissionController));

  // Get submission by ID - Protected
  fastify.get('/:id', { preHandler: [authenticate] }, submissionController.getSubmissionById.bind(submissionController));

  // Create submission (with image upload) - Protected
  fastify.post('/', { preHandler: [authenticate] }, submissionController.createSubmission.bind(submissionController));

  // Update submission - Protected
  fastify.put('/:id', { preHandler: [authenticate] }, submissionController.updateSubmission.bind(submissionController));

  // Grade submission - Teacher only
  fastify.post('/:id/grade', { preHandler: [authenticate, requireTeacher()] }, submissionController.gradeSubmission.bind(submissionController));

  // Return submission for revision - Teacher only
  fastify.post('/:id/revision', { preHandler: [authenticate, requireTeacher()] }, submissionController.returnForRevision.bind(submissionController));

  // Delete submission - Protected
  fastify.delete('/:id', { preHandler: [authenticate] }, submissionController.deleteSubmission.bind(submissionController));
}

