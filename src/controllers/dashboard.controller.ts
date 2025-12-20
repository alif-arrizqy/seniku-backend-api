import { FastifyRequest, FastifyReply } from 'fastify';
import dashboardService from '../services/dashboard.service';
import { ResponseFormatter } from '../utils/response';
import { handleError } from '../utils/error-handler';

export class DashboardController {
  async getDashboardOverview(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(reply, 'Unauthorized', 401);
      }

      let dashboardData;

      if (request.user.role === 'TEACHER') {
        dashboardData = await dashboardService.getTeacherDashboard(request.user.id);
      } else if (request.user.role === 'STUDENT') {
        dashboardData = await dashboardService.getStudentDashboard(request.user.id);
      } else {
        return ResponseFormatter.error(reply, 'Invalid user role', 403);
      }

      return ResponseFormatter.success(reply, dashboardData, 'Dashboard data retrieved successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Get dashboard error', {
        userId: request.user?.id,
      });
    }
  }
}

export default new DashboardController();

