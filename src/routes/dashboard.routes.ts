import { FastifyInstance } from 'fastify';
import dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

export default async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard overview - Protected (auto-detect role)
  fastify.get(
    '/overview',
    { preHandler: [authenticate] },
    dashboardController.getDashboardOverview.bind(dashboardController)
  );
}

