import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import env from '../config/env';

export default async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW,
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil(context.ttl / 1000),
      };
    },
  });
}

