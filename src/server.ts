import { createServer } from 'http';
import { createApp } from './app';
import { env } from '@config/env';
import { logger } from '@config/logger';
import { connectDatabase, disconnectDatabase } from '@config/database';
import { disconnectRedis, redisClient } from '@config/redis';
import { initializeSocket } from '@socket/index';
import { closeQueues } from '@queues/index';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  // ioredis connects lazily on first command; ping to fail fast on boot.
  await redisClient.ping();

  const app = createApp();
  const httpServer = createServer(app);
  initializeSocket(httpServer);

  const server = httpServer.listen(env.PORT, () => {
    logger.info(
      `🚀 ${env.APP_NAME} listening on port ${env.PORT} [${env.NODE_ENV}] — docs at ${env.APP_URL}/docs`,
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received: starting graceful shutdown`);

    server.close(async (err) => {
      if (err) {
        logger.error(err, 'Error while closing HTTP server');
        process.exitCode = 1;
      }

      try {
        await closeQueues();
        await disconnectDatabase();
        await disconnectRedis();
        logger.info('Graceful shutdown complete');
        process.exit(process.exitCode ?? 0);
      } catch (shutdownError) {
        logger.error(shutdownError, 'Error during shutdown');
        process.exit(1);
      }
    });

    // Force-exit if graceful shutdown hangs (e.g. lingering socket connections).
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error(reason, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal(err, 'Uncaught exception — shutting down');
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during bootstrap:', error);
  process.exit(1);
});
