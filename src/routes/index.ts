import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import assignmentsRoutes from './assignments.routes';
import submissionsRoutes from './submissions.routes';
import classesRoutes from './classes.routes';
import notificationsRoutes from './notifications.routes';

export default async function routes(fastify: FastifyInstance) {
  // Register all routes with prefix
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(usersRoutes, { prefix: '/users' });
  await fastify.register(assignmentsRoutes, { prefix: '/assignments' });
  await fastify.register(submissionsRoutes, { prefix: '/submissions' });
  await fastify.register(classesRoutes, { prefix: '/classes' });
  await fastify.register(notificationsRoutes, { prefix: '/notifications' });
}

