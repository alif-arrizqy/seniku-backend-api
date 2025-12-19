import 'dotenv/config';
import { buildApp } from './app';
import env from './config/env';
import logger from './utils/logger';

async function start() {
  try {
    const app = await buildApp();

    // Start server
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(`🚀 Server is running on http://${env.HOST}:${env.PORT}`);
    logger.info(`🏥 Health Check: http://${env.HOST}:${env.PORT}/health`);
    logger.info(`📚 API Documentation: See /docs folder`);
  } catch (error: any) {
    logger.error(
      {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        name: error?.name,
        code: error?.code,
      },
      'Failed to start server'
    );
    console.error('❌ Server startup error:', error?.message || error);
    if (error?.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

start();

