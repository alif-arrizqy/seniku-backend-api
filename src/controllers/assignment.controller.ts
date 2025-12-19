import { FastifyRequest, FastifyReply } from 'fastify';
import assignmentService from '../services/assignment.service';
import { ResponseFormatter } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  queryAssignmentsSchema,
  gradeSubmissionSchema,
  bulkStatusSchema,
  bulkDeleteSchema,
  idParamSchema,
} from '../validators/assignment.validator';

export class AssignmentController {
  async getAssignments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = queryAssignmentsSchema.parse(request.query);
      const pagination = parsePagination({ page: query.page, limit: query.limit });

      const filters = {
        status: query.status,
        category: query.category,
        classId: query.classId,
        search: query.search,
        createdById: request.user?.role === 'TEACHER' ? request.user.id : undefined,
      };

      const { assignments, total } = await assignmentService.findAssignments(filters, pagination);

      return ResponseFormatter.paginated(reply, assignments, pagination, 'Assignments retrieved successfully');
    } catch (error: any) {
      throw error;
    }
  }

  async getAssignmentById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const assignment = await assignmentService.findAssignmentById(id);

      return ResponseFormatter.success(reply, { assignment }, 'Assignment retrieved successfully');
    } catch (error: any) {
      throw error;
    }
  }

  async createAssignment(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(reply, 'Unauthorized', 401);
      }

      const validated = createAssignmentSchema.parse(request.body);
      const assignment = await assignmentService.createAssignment({
        ...validated,
        deadline: new Date(validated.deadline),
        createdById: request.user.id,
      });

      return ResponseFormatter.success(reply, { assignment }, 'Assignment created successfully', 201);
    } catch (error: any) {
      throw error;
    }
  }

  async updateAssignment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const validated = updateAssignmentSchema.parse(request.body);

      const updateData: any = { ...validated };
      if (validated.deadline) {
        updateData.deadline = new Date(validated.deadline);
      }

      const assignment = await assignmentService.updateAssignment(id, updateData);

      return ResponseFormatter.success(reply, { assignment }, 'Assignment updated successfully');
    } catch (error: any) {
      throw error;
    }
  }

  async deleteAssignment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      await assignmentService.deleteAssignment(id);

      return ResponseFormatter.success(reply, null, 'Assignment deleted successfully');
    } catch (error: any) {
      throw error;
    }
  }

  async bulkUpdateStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = bulkStatusSchema.parse(request.body);
      await assignmentService.bulkUpdateStatus(validated.assignmentIds, validated.status);

      return ResponseFormatter.success(reply, null, 'Assignments status updated successfully');
    } catch (error: any) {
      throw error;
    }
  }

  async bulkDelete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = bulkDeleteSchema.parse(request.body);
      await assignmentService.bulkDelete(validated.assignmentIds);

      return ResponseFormatter.success(reply, null, 'Assignments deleted successfully');
    } catch (error: any) {
      throw error;
    }
  }
}

export default new AssignmentController();

