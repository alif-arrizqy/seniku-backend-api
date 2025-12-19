import { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import env from '../config/env';
import logger from '../utils/logger';

export default async function sessionPlugin(fastify: FastifyInstance) {
  try {
    // Validate SESSION_SECRET length (required by @fastify/session)
    if (env.SESSION_SECRET.length < 32) {
      throw new Error(
        `SESSION_SECRET must be at least 32 characters long. Current length: ${env.SESSION_SECRET.length}. ` +
        `Please update your .env file with a longer secret (e.g., generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")`
      );
    }

    // Register cookie plugin first (required by @fastify/session)
    await fastify.register(cookie, {
      secret: env.SESSION_SECRET,
      parseOptions: {},
    });

    logger.debug('Cookie plugin registered');

    // Register session plugin
    // @fastify/session automatically creates request.session for each request
    await fastify.register(session, {
      secret: env.SESSION_SECRET,
      cookieName: 'sessionId',
      cookie: {
        secure: env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: env.SESSION_MAX_AGE,
        sameSite: 'lax',
        path: '/',
      },
      saveUninitialized: true, // Save sessions even when not modified
      rolling: true, // Reset expiration on every response
      // No store specified = uses memory store (default)
      // This works for development but sessions will be lost on server restart
      // For production, configure a proper store (Redis, database, etc.)
    });

    logger.info('Session plugin registered successfully');
  } catch (error: any) {
    logger.error(
      {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
      },
      'Failed to register session plugin'
    );
    throw error;
  }
}

