import { Job, Worker } from 'bullmq';
import { NotificationType } from '@prisma/client';
import { createRedisConnection } from '@config/redis';
import { QueueName } from '@queues/queueNames.constant';
import { NotificationJobData } from '@queues/jobPayloads.types';
import { notificationService } from '@services/notification.service';
import { createChildLogger } from '@config/logger';

const logger = createChildLogger('worker:notification');

export function createNotificationWorker(): Worker<NotificationJobData> {
  return new Worker<NotificationJobData>(
    QueueName.NOTIFICATION,
    async (job: Job<NotificationJobData>) => {
      await notificationService.dispatch({
        userIds: job.data.userIds,
        type: job.data.type as NotificationType,
        title: job.data.title,
        body: job.data.body,
        data: job.data.data,
        actionUrl: job.data.actionUrl,
        createdBy: job.data.createdBy,
      });
    },
    { connection: createRedisConnection(), concurrency: 10 },
  )
    .on('completed', (job) => logger.info({ jobId: job.id }, 'Notification job completed'))
    .on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Notification job failed'));
}
