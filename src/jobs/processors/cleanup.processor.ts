import { Job, Worker } from 'bullmq';
import { createRedisConnection } from '@config/redis';
import { getQueue } from '@queues/index';
import { QueueName } from '@queues/queueNames.constant';
import { CleanupJobData } from '@queues/jobPayloads.types';
import { prisma } from '@config/database';
import { notificationRepository } from '@repositories/notification.repository';
import { createChildLogger } from '@config/logger';

const logger = createChildLogger('worker:cleanup');

const RETENTION_DAYS = 30;

async function runCleanupTask(task: CleanupJobData['task']): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  switch (task) {
    case 'EXPIRED_REFRESH_TOKENS': {
      const result = await prisma.refreshToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true, revokedAt: { lt: cutoff } }] },
      });
      return result.count;
    }
    case 'EXPIRED_OTPS': {
      const result = await prisma.otpCode.deleteMany({
        where: { OR: [{ expiresAt: { lt: new Date() } }, { isUsed: true }] },
      });
      return result.count;
    }
    case 'TEMPORARY_FILES': {
      // Metadata cleanup only — actual S3 object deletion for orphaned temp
      // uploads is intentionally conservative and left to a periodic audit
      // job outside the hot path, to avoid deleting in-flight uploads.
      const result = await prisma.fileAsset.deleteMany({
        where: { entityType: 'TEMPORARY', createdAt: { lt: cutoff } },
      });
      return result.count;
    }
    case 'STALE_NOTIFICATIONS': {
      const result = await notificationRepository.deleteArchivedOlderThan(cutoff);
      return result.count;
    }
    default:
      return 0;
  }
}

export function createCleanupWorker(): Worker<CleanupJobData> {
  return new Worker<CleanupJobData>(
    QueueName.CLEANUP,
    async (job: Job<CleanupJobData>) => {
      const deletedCount = await runCleanupTask(job.data.task);
      logger.info({ task: job.data.task, deletedCount }, 'Cleanup task completed');
      return { deletedCount };
    },
    { connection: createRedisConnection(), concurrency: 1 },
  ).on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Cleanup job failed'));
}

/** Registers recurring cleanup jobs. Safe to call on every worker boot — BullMQ dedupes by job id. */
export async function scheduleCleanupJobs(): Promise<void> {
  const queue = getQueue(QueueName.CLEANUP);
  const tasks: CleanupJobData['task'][] = [
    'EXPIRED_REFRESH_TOKENS',
    'EXPIRED_OTPS',
    'TEMPORARY_FILES',
    'STALE_NOTIFICATIONS',
  ];

  for (const task of tasks) {
    await queue.add(
      task,
      { task },
      { repeat: { pattern: '0 3 * * *' }, jobId: `cleanup-${task}` }, // daily at 03:00
    );
  }
}
