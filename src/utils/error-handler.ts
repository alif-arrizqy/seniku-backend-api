import { FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { ResponseFormatter } from './response';
import { ErrorMessages, ErrorStatusCodes } from '../constants/error-messages';
import logger from './logger';

export interface ErrorContext {
  userId?: string;
  identifier?: string;
  body?: any;
  params?: any;
  query?: any;
  [key: string]: any;
}

/**
 * Format Zod validation errors into a structured format
 */
export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });
  return errors;
}

/**
 * Log error with context
 */
export function logError(
  error: any,
  context: string,
  additionalContext?: ErrorContext
): void {
  logger.error(
    {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
      ...additionalContext,
    },
    context
  );
}

/**
 * Handle and format error response
 */
export function handleError(
  reply: FastifyReply,
  error: any,
  context: string,
  additionalContext?: ErrorContext
): FastifyReply {
  // Log error
  logError(error, context, additionalContext);

  // Handle Zod validation errors
  if (error?.name === 'ZodError' || error instanceof ZodError) {
    const zodError = error as ZodError;
    const errors = formatZodErrors(zodError);
    return ResponseFormatter.error(
      reply,
      ErrorMessages.VALIDATION.INVALID_INPUT,
      ErrorStatusCodes.VALIDATION_ERROR,
      errors
    );
  }

  // Handle authentication errors
  if (error?.message === 'Invalid credentials') {
    return ResponseFormatter.error(
      reply,
      ErrorMessages.AUTH.INVALID_CREDENTIALS,
      ErrorStatusCodes.UNAUTHORIZED
    );
  }

  if (error?.message === 'Account is inactive') {
    return ResponseFormatter.error(
      reply,
      ErrorMessages.AUTH.ACCOUNT_INACTIVE,
      ErrorStatusCodes.FORBIDDEN
    );
  }

  // Handle duplicate/conflict errors
  if (error?.message?.includes(ErrorMessages.RESOURCE.ALREADY_EXISTS)) {
    return ResponseFormatter.error(
      reply,
      error.message,
      ErrorStatusCodes.CONFLICT
    );
  }

  // Handle not found errors
  if (error?.message === 'User not found' || error?.message?.includes('not found')) {
    return ResponseFormatter.error(
      reply,
      error.message || ErrorMessages.RESOURCE.NOT_FOUND,
      ErrorStatusCodes.NOT_FOUND
    );
  }

  // Handle permission errors
  if (error?.message?.includes('Forbidden') || error?.message?.includes('permission')) {
    return ResponseFormatter.error(
      reply,
      error.message || ErrorMessages.PERMISSION.FORBIDDEN,
      ErrorStatusCodes.FORBIDDEN
    );
  }

  // Default error response
  return ResponseFormatter.error(
    reply,
    error?.message || ErrorMessages.SERVER.UNKNOWN_ERROR,
    ErrorStatusCodes.INTERNAL_SERVER_ERROR
  );
}

/**
 * Wrapper for async controller methods with error handling
 */
export function asyncHandler(
  handler: (request: any, reply: FastifyReply) => Promise<FastifyReply | void>,
  context: string
) {
  return async (request: any, reply: FastifyReply) => {
    try {
      return await handler(request, reply);
    } catch (error: any) {
      return handleError(reply, error, context, {
        body: request.body,
        params: request.params,
        query: request.query,
        userId: request.user?.id,
      });
    }
  };
}

