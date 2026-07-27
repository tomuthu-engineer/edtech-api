import { Job, Worker } from 'bullmq';
import { createRedisConnection } from '@config/redis';
import { QueueName } from '@queues/queueNames.constant';
import { EmailJobData } from '@queues/jobPayloads.types';
import { sendMail } from '@lib/mailer';
import { createChildLogger } from '@config/logger';

const logger = createChildLogger('worker:email');

export function createEmailWorker(): Worker<EmailJobData> {
  return new Worker<EmailJobData>(
    QueueName.EMAIL,
    async (job: Job<EmailJobData>) => {
      await sendMail(job.data);
    },
    { connection: createRedisConnection(), concurrency: 10 },
  )
    .on('completed', (job) => logger.info({ jobId: job.id, to: job.data.to }, 'Email job completed'))
    .on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Email job failed'));
}
