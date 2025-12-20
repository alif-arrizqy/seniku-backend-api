import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../config/database';
import { ResponseFormatter } from '../utils/response';
import logger from '../utils/logger';
import { JWTService } from '../utils/jwt';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFormatter.error(reply, 'Unauthorized. Please login first.', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify access token
    let decoded;
    try {
      decoded = JWTService.verifyAccessToken(token);
    } catch (error: any) {
      if (error.message.includes('expired')) {
        return ResponseFormatter.error(reply, 'Access token expired', 401);
      }
      return ResponseFormatter.error(reply, 'Invalid access token', 401);
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return; // No token, continue without authentication
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify access token
    let decoded;
    try {
      decoded = JWTService.verifyAccessToken(token);
    } catch (error) {
      // Token invalid or expired, continue without authentication
      return;
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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
  } catch (error) {
    // Optional auth, so we don't fail on error
    logger.debug({ error }, 'Optional authentication failed');
  }
}

