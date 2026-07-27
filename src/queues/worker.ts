import { Worker } from 'bullmq';
import { logger } from '@config/logger';
import { connectDatabase, disconnectDatabase } from '@config/database';
import { disconnectRedis } from '@config/redis';
import { createEmailWorker } from '@jobs/processors/email.processor';
import { createNotificationWorker } from '@jobs/processors/notification.processor';
import { createReportWorker } from '@jobs/processors/report.processor';
import { createCleanupWorker, scheduleCleanupJobs } from '@jobs/processors/cleanup.processor';

/**
 * Standalone worker process (`npm run worker`). Runs separately from the
 * HTTP API so background job throughput never competes with request
 * latency, and either can scale independently.
 */
async function bootstrapWorker(): Promise<void> {
  await connectDatabase();

  const workers: Worker[] = [
    createEmailWorker(),
    createNotificationWorker(),
    createReportWorker(),
    createCleanupWorker(),
  ];

  await scheduleCleanupJobs();

  logger.info(`Worker process started with ${workers.length} queue workers`);

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received: shutting down workers`);
    await Promise.all(workers.map((worker) => worker.close()));
    await disconnectDatabase();
    await disconnectRedis();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrapWorker().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during worker bootstrap:', error);
  process.exit(1);
});
