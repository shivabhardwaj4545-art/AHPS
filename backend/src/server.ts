import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/db.js';
import { dispatchJob, QUEUE_NAMES } from './jobs/queue.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`=======================================================`);
  logger.info(`🏫 ${env.APP_NAME}`);
  logger.info(`🚀 Server running on port ${PORT} [${env.NODE_ENV}]`);
  logger.info(`📑 Swagger Docs: http://localhost:${PORT}/api/docs`);
  logger.info(`🩺 Health Check: http://localhost:${PORT}/health`);
  logger.info(`=======================================================`);

  // Start periodic sync polling (e.g., every 15 minutes)
  setInterval(() => {
    dispatchJob(QUEUE_NAMES.DEVICE_SYNC, 'periodic-device-sync');
  }, 15 * 60 * 1000);
});

// Graceful Shutdown Handler
const handleGracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully terminating server...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info('Database connections closed.');
      process.exit(0);
    } catch (err: any) {
      logger.error(`Error during shutdown: ${err.message}`);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

