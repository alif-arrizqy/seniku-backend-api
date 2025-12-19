import { FastifyRequest, FastifyReply } from 'fastify';
import authService from '../services/auth.service';
import { ResponseFormatter } from '../utils/response';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import logger from '../utils/logger';

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = registerSchema.parse(request.body);
      const user = await authService.register(validated);

      return ResponseFormatter.success(reply, { user }, 'User registered successfully', 201);
    } catch (error: any) {
      logger.error({ error }, 'Registration error');
      throw error;
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = loginSchema.parse(request.body);
      const user = await authService.login(validated);

      // Set session
      request.session.set('userId', user.id);
      request.session.set('role', user.role);
      if (user.nip) {
        request.session.set('nip', user.nip);
      }
      if (user.nis) {
        request.session.set('nis', user.nis);
      }
      if (user.email) {
        request.session.set('email', user.email);
      }

      logger.info({ userId: user.id }, 'User logged in');

      return ResponseFormatter.success(reply, { user }, 'Login successful');
    } catch (error: any) {
      logger.error({ error }, 'Login error');
      throw error;
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      request.session.delete();
      return ResponseFormatter.success(reply, null, 'Logout successful');
    } catch (error: any) {
      logger.error({ error }, 'Logout error');
      throw error;
    }
  }

  async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(reply, 'Unauthorized', 401);
      }

      const user = await authService.getUserById(request.user.id);
      return ResponseFormatter.success(reply, { user }, 'User retrieved successfully');
    } catch (error: any) {
      logger.error({ error }, 'Get current user error');
      throw error;
    }
  }
}

export default new AuthController();

