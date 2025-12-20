import { FastifyRequest, FastifyReply } from 'fastify';
import categoryService from '../services/category.service';
import { ResponseFormatter } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import { idParamSchema } from '../validators/common.validator';
import { createCategorySchema, updateCategorySchema, queryCategoriesSchema } from '../validators/category.validator';
import { handleError } from '../utils/error-handler';

export class CategoryController {
  async getCategories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = queryCategoriesSchema.parse(request.query);
      const pagination = parsePagination({ page: query.page, limit: query.limit });

      const filters = {
        search: query.search,
        isActive: query.isActive,
      };

      const { categories, total } = await categoryService.findCategories(filters, pagination);

      return ResponseFormatter.paginated(
        reply,
        categories,
        {
          page: pagination.page,
          limit: pagination.limit,
          total,
        },
        'Categories retrieved successfully'
      );
    } catch (error: any) {
      return handleError(reply, error, 'Get categories error', {
        query: request.query,
        userId: request.user?.id,
      });
    }
  }

  async getCategoryById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const category = await categoryService.findCategoryById(id);

      return ResponseFormatter.success(reply, { category }, 'Category retrieved successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Get category by ID error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }

  async createCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = createCategorySchema.parse(request.body);
      const category = await categoryService.createCategory(validated);

      return ResponseFormatter.success(reply, { category }, 'Category created successfully', 201);
    } catch (error: any) {
      return handleError(reply, error, 'Create category error', {
        body: request.body,
        userId: request.user?.id,
      });
    }
  }

  async updateCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const validated = updateCategorySchema.parse(request.body);

      const category = await categoryService.updateCategory(id, validated);

      return ResponseFormatter.success(reply, { category }, 'Category updated successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Update category error', {
        params: request.params,
        body: request.body,
        userId: request.user?.id,
      });
    }
  }

  async deleteCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const force = (request.query as any)?.force === 'true';

      await categoryService.deleteCategory(id, force);

      return ResponseFormatter.success(reply, null, 'Category deleted successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Delete category error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }
}

export default new CategoryController();

