import Fastify, { FastifyInstance } from 'fastify';
import logger from './utils/logger';
import errorHandler from './middleware/error.middleware';

// Plugins
import swaggerPlugin from './plugins/swagger';
import corsPlugin from './plugins/cors';
import helmetPlugin from './plugins/helmet';
import rateLimitPlugin from './plugins/rate-limit';
import sessionPlugin from './plugins/session';

// Routes
import routes from './routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // We use our custom logger
  });

  // Register plugins
  await app.register(helmetPlugin);
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(sessionPlugin);
  await app.register(swaggerPlugin);

  // Register routes with prefix
  await app.register(routes, { prefix: '/api/v1' });

  // Welcome endpoint
  app.get('/', async (request, reply) => {
    return { message: 'Welcome to the Seniku API ;)' };
  });

  // Health check endpoint
  app.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register error handler (must be last)
  errorHandler(app);

  return app;
}

