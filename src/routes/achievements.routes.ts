import { FastifyInstance } from 'fastify';
import achievementController from '../controllers/achievement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTeacher } from '../middleware/role.middleware';

export default async function achievementsRoutes(fastify: FastifyInstance) {
  // Get all achievements - Public (authenticated users)
  fastify.get('/', { preHandler: [authenticate] }, achievementController.getAchievements.bind(achievementController));

  // Get achievement by ID - Public (authenticated users)
  fastify.get('/:id', { preHandler: [authenticate] }, achievementController.getAchievementById.bind(achievementController));

  // Get user achievements - Protected (own achievements)
  fastify.get('/me/achievements', { preHandler: [authenticate] }, achievementController.getUserAchievements.bind(achievementController));

  // Create achievement - Teacher/Admin only
  fastify.post('/', { preHandler: [authenticate, requireTeacher()] }, achievementController.createAchievement.bind(achievementController));

  // Update achievement - Teacher/Admin only
  fastify.put('/:id', { preHandler: [authenticate, requireTeacher()] }, achievementController.updateAchievement.bind(achievementController));

  // Delete achievement - Teacher/Admin only
  fastify.delete('/:id', { preHandler: [authenticate, requireTeacher()] }, achievementController.deleteAchievement.bind(achievementController));
}

