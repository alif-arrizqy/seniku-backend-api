import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ResponseFormatter } from '../utils/response';
import logger from '../utils/logger';

export default function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // Log error
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
      },
      'Request error'
    );

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });

      return ResponseFormatter.error(reply, 'Validation error', 400, errors);
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return ResponseFormatter.error(reply, 'Duplicate entry. This record already exists.', 409);
      }
      if (error.code === 'P2025') {
        return ResponseFormatter.error(reply, 'Record not found', 404);
      }
      if (error.code === 'P2003') {
        return ResponseFormatter.error(reply, 'Foreign key constraint failed', 400);
      }
      logger.error({ code: error.code, meta: error.meta }, 'Prisma error');
      return ResponseFormatter.error(reply, 'Database error', 500);
    }

    // Handle known HTTP errors
    if (error.statusCode) {
      return ResponseFormatter.error(reply, error.message, error.statusCode);
    }

    // Default error
    return ResponseFormatter.error(
      reply,
      error.message || 'Internal server error',
      error.statusCode || 500
    );
  });

  // Handle 404
  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    return ResponseFormatter.error(reply, 'Route not found', 404);
  });
}

