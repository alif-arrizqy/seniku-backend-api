import { FastifyInstance } from 'fastify';
import portfolioController from '../controllers/portfolio.controller';
import { authenticate } from '../middleware/auth.middleware';

export default async function portfolioRoutes(fastify: FastifyInstance) {
  // Get all portfolio items - Protected
  fastify.get('/', { preHandler: [authenticate] }, portfolioController.getPortfolioItems.bind(portfolioController));

  // Get portfolio item by ID - Protected
  fastify.get(
    '/:id',
    { preHandler: [authenticate] },
    portfolioController.getPortfolioItemById.bind(portfolioController)
  );
}

