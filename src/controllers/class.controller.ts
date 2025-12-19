import { FastifyRequest, FastifyReply } from 'fastify';
import classService from '../services/class.service';
import { ResponseFormatter } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import { idParamSchema } from '../validators/common.validator';
import { z } from 'zod';

const createClassSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const queryClassesSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10'),
  search: z.string().optional(),
});

export class ClassController {
  async getClasses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = queryClassesSchema.parse(request.query);
      const pagination = parsePagination({ page: query.page, limit: query.limit });

      const filters = {
        search: query.search,
      };

      const { classes, total } = await classService.findClasses(filters, pagination);

      return ResponseFormatter.paginated(reply, classes, pagination, 'Classes retrieved successfully');
    } catch (error: any) {
      throw error;
    }
  }

  async getClassById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const classData = await classService.findClassById(id);

      return ResponseFormatter.success(reply, { class: classData }, 'Class retrieved successfully');
    } catch (error: any) {
      throw error;
    }
  }

  async createClass(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = createClassSchema.parse(request.body);
      const classData = await classService.createClass(validated);

      return ResponseFormatter.success(reply, { class: classData }, 'Class created successfully', 201);
    } catch (error: any) {
      throw error;
    }
  }

  async updateClass(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const validated = updateClassSchema.parse(request.body);

      const classData = await classService.updateClass(id, validated);

      return ResponseFormatter.success(reply, { class: classData }, 'Class updated successfully');
    } catch (error: any) {
      throw error;
    }
  }

  async deleteClass(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      await classService.deleteClass(id);

      return ResponseFormatter.success(reply, null, 'Class deleted successfully');
    } catch (error: any) {
      throw error;
    }
  }
}

export default new ClassController();

