import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ResponseFormatter } from '../utils/response';
import logger from '../utils/logger';
import { ErrorMessages } from '../constants/error-messages';

export default function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // Log error with full context (with safe access)
    try {
      logger.error(
        {
          error: error?.message || 'Unknown error',
          stack: error?.stack,
          name: error?.name,
          code: (error as any)?.code,
          statusCode: error?.statusCode,
          url: request?.url,
          method: request?.method,
          params: request?.params,
          query: request?.query,
          body: request?.body,
          userId: (request as any)?.user?.id,
          ip: request?.ip,
          userAgent: request?.headers?.['user-agent'],
        },
        'Request error'
      );
    } catch (logError: any) {
      // If logging fails, at least log basic error
      console.error('Error logging failed:', logError);
      console.error('Original error:', error?.message || error);
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      try {
        const zodError = error as ZodError;
        if (zodError && zodError.issues && Array.isArray(zodError.issues) && zodError.issues.length > 0) {
          const errors: Record<string, string[]> = {};
          zodError.issues.forEach((issue: any) => {
            if (issue && typeof issue === 'object') {
              const path = (issue.path && Array.isArray(issue.path)) 
                ? issue.path.join('.') 
                : 'unknown';
              const message = issue.message || 'Validation error';
              if (!errors[path]) {
                errors[path] = [];
              }
              errors[path].push(message);
            }
          });

          // Create a more user-friendly message
          const firstErrorKey = Object.keys(errors)[0];
          const firstErrorMessage = errors[firstErrorKey]?.[0] || 'Validation error';
          return ResponseFormatter.error(reply, firstErrorMessage, 400, errors);
        }
      } catch (formatError: any) {
        logger.error({ formatError, originalError: error }, 'Error formatting Zod errors');
        return ResponseFormatter.error(reply, 'Validation error', 400);
      }
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

    // Handle not found errors (fallback if not handled by controller)
    if (
      error.message &&
      (error.message === ErrorMessages.RESOURCE.USER_NOT_FOUND ||
        error.message === 'User not found' ||
        error.message.includes('not found'))
    ) {
      return ResponseFormatter.error(reply, error.message, 404);
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
  fastify.setNotFoundHandler((_request: FastifyRequest, reply: FastifyReply) => {
    return ResponseFormatter.error(reply, 'Route not found', 404);
  });
}

