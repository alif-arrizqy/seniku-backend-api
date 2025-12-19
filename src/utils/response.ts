import { FastifyReply } from 'fastify';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ResponseFormatter {
  static success<T>(reply: FastifyReply, data?: T, message?: string, statusCode = 200): FastifyReply {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return reply.code(statusCode).send(response);
  }

  static error(
    reply: FastifyReply,
    error: string | Error,
    statusCode = 400,
    errors?: Record<string, string[]>
  ): FastifyReply {
    const errorMessage = error instanceof Error ? error.message : error;
    const response: ApiResponse = {
      success: false,
      error: errorMessage,
      errors,
    };
    return reply.code(statusCode).send(response);
  }

  static paginated<T>(
    reply: FastifyReply,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string
  ): FastifyReply {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const response: PaginatedResponse<T> = {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
    return reply.code(200).send(response);
  }
}

