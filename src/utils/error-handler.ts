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
  try {
    if (error && error.issues && Array.isArray(error.issues) && error.issues.length > 0) {
      error.issues.forEach((issue) => {
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
    }
  } catch (formatError: any) {
    logger.error({ formatError, originalError: error }, 'Error formatting Zod errors');
  }
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
    try {
      const zodError = error as ZodError;
      const errors = formatZodErrors(zodError);
      // Only include errors object if it has content
      if (Object.keys(errors).length > 0) {
        // Create a more user-friendly message
        const firstErrorKey = Object.keys(errors)[0];
        const firstErrorMessage = errors[firstErrorKey]?.[0] || ErrorMessages.VALIDATION.INVALID_INPUT;
        return ResponseFormatter.error(
          reply,
          firstErrorMessage,
          ErrorStatusCodes.VALIDATION_ERROR,
          errors
        );
      }
      // Fallback if errors object is empty
      return ResponseFormatter.error(
        reply,
        ErrorMessages.VALIDATION.INVALID_INPUT,
        ErrorStatusCodes.VALIDATION_ERROR
      );
    } catch (formatError: any) {
      logger.error({ formatError, originalError: error }, 'Error handling ZodError');
      return ResponseFormatter.error(
        reply,
        ErrorMessages.VALIDATION.INVALID_INPUT,
        ErrorStatusCodes.VALIDATION_ERROR
      );
    }
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
  if (
    error?.message === ErrorMessages.RESOURCE.USER_NOT_FOUND ||
    error?.message === 'User not found' ||
    error?.message?.includes('not found')
  ) {
    return ResponseFormatter.error(
      reply,
      error.message || ErrorMessages.RESOURCE.USER_NOT_FOUND,
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

