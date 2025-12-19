import { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import env from '../config/env';

export default async function sessionPlugin(fastify: FastifyInstance) {
  // Register cookie plugin first
  await fastify.register(cookie, {
    secret: env.SESSION_SECRET,
    parseOptions: {},
  });

  // Register session plugin
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
  });
}

