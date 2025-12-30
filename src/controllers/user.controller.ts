import { FastifyRequest, FastifyReply } from 'fastify';
import userService from '../services/user.service';
import { ResponseFormatter } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import { queryUsersSchema, updateUserSchema, createUserSchema } from '../validators/user.validator';
import { idParamSchema } from '../validators/common.validator';
import { handleError } from '../utils/error-handler';

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

      return ResponseFormatter.paginated(reply, users, { ...pagination, total }, 'Users retrieved successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Get users error', {
        query: request.query,
        userId: request.user?.id,
      });
    }
  }

  async getUserById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const user = await userService.findUserById(id);

      return ResponseFormatter.success(reply, { user }, 'User retrieved successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Get user by ID error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }

  async createUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = createUserSchema.parse(request.body);
      
      // Convert birthdate string to Date if needed
      const createData = {
        ...validated,
        birthdate: validated.birthdate instanceof Date 
          ? validated.birthdate 
          : validated.birthdate 
            ? new Date(validated.birthdate) 
            : undefined,
      };
      
      const user = await userService.createUser(createData);

      return ResponseFormatter.success(reply, { user }, 'User created successfully', 201);
    } catch (error: any) {
      return handleError(reply, error, 'Create user error', {
        body: request.body,
        userId: request.user?.id,
      });
    }
  }

  async updateUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const validated = updateUserSchema.parse(request.body);

      const user = await userService.updateUser(id, validated);

      return ResponseFormatter.success(reply, { user }, 'User updated successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Update user error', {
        params: request.params,
        body: request.body,
        userId: request.user?.id,
      });
    }
  }

  async deleteUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      await userService.deleteUser(id);

      return ResponseFormatter.success(reply, null, 'User deleted successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Delete user error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }
}

export default new UserController();

