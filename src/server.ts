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
    logger.info(`📚 API Documentation: http://${env.HOST}:${env.PORT}/docs`);
    logger.info(`🏥 Health Check: http://${env.HOST}:${env.PORT}/health`);
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
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

