import { FastifyRequest, FastifyReply } from 'fastify';
import achievementService from '../services/achievement.service';
import { ResponseFormatter } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import { idParamSchema } from '../validators/common.validator';
import {
  createAchievementSchema,
  updateAchievementSchema,
  queryAchievementsSchema,
} from '../validators/achievement.validator';
import { handleError } from '../utils/error-handler';

export class AchievementController {
  async getAchievements(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = queryAchievementsSchema.parse(request.query);
      const pagination = parsePagination({ page: query.page, limit: query.limit });

      const filters = {
        search: query.search,
      };

      const { achievements, total } = await achievementService.findAchievements(filters, pagination);

      return ResponseFormatter.paginated(
        reply,
        achievements,
        {
          page: pagination.page,
          limit: pagination.limit,
          total,
        },
        'Achievements retrieved successfully'
      );
    } catch (error: any) {
      return handleError(reply, error, 'Get achievements error', {
        query: request.query,
        userId: request.user?.id,
      });
    }
  }

  async getAchievementById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const achievement = await achievementService.findAchievementById(id);

      return ResponseFormatter.success(reply, { achievement }, 'Achievement retrieved successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Get achievement by ID error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }

  async createAchievement(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = createAchievementSchema.parse(request.body);
      const achievement = await achievementService.createAchievement(validated);

      return ResponseFormatter.success(reply, { achievement }, 'Achievement created successfully', 201);
    } catch (error: any) {
      return handleError(reply, error, 'Create achievement error', {
        body: request.body,
        userId: request.user?.id,
      });
    }
  }

  async updateAchievement(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const validated = updateAchievementSchema.parse(request.body);

      const achievement = await achievementService.updateAchievement(id, validated);

      return ResponseFormatter.success(reply, { achievement }, 'Achievement updated successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Update achievement error', {
        params: request.params,
        body: request.body,
        userId: request.user?.id,
      });
    }
  }

  async deleteAchievement(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const force = (request.query as any)?.force === 'true';

      await achievementService.deleteAchievement(id, force);

      return ResponseFormatter.success(reply, null, 'Achievement deleted successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Delete achievement error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }

  async getUserAchievements(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(reply, 'Unauthorized', 401);
      }

      const achievements = await achievementService.getUserAchievements(request.user.id);

      return ResponseFormatter.success(reply, { achievements }, 'User achievements retrieved successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Get user achievements error', {
        userId: request.user?.id,
      });
    }
  }
}

export default new AchievementController();

