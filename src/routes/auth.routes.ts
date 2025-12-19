import { FastifyInstance } from 'fastify';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export default async function authRoutes(fastify: FastifyInstance) {
  // Register - Public endpoint
  fastify.post('/register', authController.register.bind(authController));

  // Login - Public endpoint
  fastify.post('/login', authController.login.bind(authController));

  // Refresh token - Public endpoint
  fastify.post('/refresh', authController.refreshToken.bind(authController));

  // Logout - Protected endpoint
  fastify.post('/logout', { preHandler: [authenticate] }, authController.logout.bind(authController));

  // Get current user - Protected endpoint
  fastify.get('/me', { preHandler: [authenticate] }, authController.getCurrentUser.bind(authController));
}

