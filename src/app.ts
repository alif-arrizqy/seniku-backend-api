import Fastify, { FastifyInstance } from 'fastify';
import errorHandler from './middleware/error.middleware';

// Plugins
import corsPlugin from './plugins/cors';

// Routes
import routes from './routes';

export async function buildApp(): Promise<FastifyInstance> {
  try {
    const app = Fastify({
      logger: false, // We use our custom logger
    });

    // Register plugins (CORS first)
    await app.register(corsPlugin);

    // Register routes with prefix
    await app.register(routes, { prefix: '/api/v1' });

    // Welcome endpoint
    app.get('/', async () => {
      return { message: 'Welcome to Seniku API 🎨' };
    });

    // Health check endpoint
    app.get('/health', async () => {
      return { 
        success: true,
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'seniku-backend-api',
        version: '1.0.0',
      };
    });

    // Register error handler (must be last)
    errorHandler(app);

    return app;
  } catch (error: any) {
    console.error('❌ Error building app:', error?.message || error);
    if (error?.stack) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

