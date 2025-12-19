import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
import { ResponseFormatter } from '../utils/response';

export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return ResponseFormatter.error(reply, 'Unauthorized', 401);
    }

    if (!allowedRoles.includes(request.user.role)) {
      return ResponseFormatter.error(
        reply,
        `Forbidden. Required role: ${allowedRoles.join(' or ')}`,
        403
      );
    }
  };
}

export function requireTeacher() {
  return requireRole(UserRole.TEACHER, UserRole.ADMIN);
}

export function requireStudent() {
  return requireRole(UserRole.STUDENT);
}

export function requireAdmin() {
  return requireRole(UserRole.ADMIN);
}

