import { FastifyInstance } from 'fastify';
import categoryController from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTeacher } from '../middleware/role.middleware';

export default async function categoriesRoutes(fastify: FastifyInstance) {
  // Get all categories - Protected
  fastify.get('/', { preHandler: [authenticate] }, categoryController.getCategories.bind(categoryController));

  // Get category by ID - Protected
  fastify.get('/:id', { preHandler: [authenticate] }, categoryController.getCategoryById.bind(categoryController));

  // Create category - Teacher only
  fastify.post(
    '/',
    { preHandler: [authenticate, requireTeacher()] },
    categoryController.createCategory.bind(categoryController)
  );

  // Update category - Teacher only
  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireTeacher()] },
    categoryController.updateCategory.bind(categoryController)
  );

  // Delete category - Teacher only
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireTeacher()] },
    categoryController.deleteCategory.bind(categoryController)
  );
}

