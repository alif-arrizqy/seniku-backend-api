import { FastifyRequest, FastifyReply } from 'fastify';
import userService from '../services/user.service';
import { ResponseFormatter } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import { queryUsersSchema, updateUserSchema, idParamSchema } from '../validators/user.validator';

export class UserController {
  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = queryUsersSchema.parse(request.query);
      const pagination = parsePagination({ page: query.page, limit: query.limit });

      const filters = {
        role: query.role,
        search: query.search,
        classId: query.classId,
      };

      const { users, total } = await userService.findUsers(filters, pagination);

      return ResponseFormatter.paginated(reply, users, pagination, 'Users retrieved successfully');
    } catch (error: any) {
      throw error;
    }
  }

  async getUserById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const user = await userService.findUserById(id);

      return ResponseFormatter.success(reply, { user }, 'User retrieved successfully');
    } catch (error: any) {
      throw error;
    }
  }

  async updateUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const validated = updateUserSchema.parse(request.body);

      const user = await userService.updateUser(id, validated);

      return ResponseFormatter.success(reply, { user }, 'User updated successfully');
    } catch (error: any) {
      throw error;
    }
  }

  async deleteUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      await userService.deleteUser(id);

      return ResponseFormatter.success(reply, null, 'User deleted successfully');
    } catch (error: any) {
      throw error;
    }
  }
}

export default new UserController();

