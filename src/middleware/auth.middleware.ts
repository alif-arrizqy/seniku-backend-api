import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../config/database';
import { ResponseFormatter } from '../utils/response';
import logger from '../utils/logger';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const sessionId = request.session.sessionId;
    const userId = request.session.get('userId');

    if (!userId) {
      return ResponseFormatter.error(reply, 'Unauthorized. Please login first.', 401);
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nip: true,
        nis: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      request.session.delete();
      return ResponseFormatter.error(reply, 'User not found or inactive', 401);
    }

    // Attach user to request
    request.user = {
      id: user.id,
      email: user.email,
      nip: user.nip,
      nis: user.nis,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };
  } catch (error) {
    logger.error({ error }, 'Authentication error');
    return ResponseFormatter.error(reply, 'Authentication failed', 401);
  }
}

export async function optionalAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.session.get('userId');

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nip: true,
          nis: true,
          name: true,
          role: true,
          avatar: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        request.user = {
          id: user.id,
          email: user.email,
          nip: user.nip,
          nis: user.nis,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        };
      }
    }
  } catch (error) {
    // Optional auth, so we don't fail on error
    logger.debug({ error }, 'Optional authentication failed');
  }
}

