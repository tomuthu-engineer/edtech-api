import { Queue, QueueOptions } from 'bullmq';
import { createRedisConnection } from '@config/redis';
import { QueueName } from '@queues/queueNames.constant';
import { createChildLogger } from '@config/logger';

const logger = createChildLogger('queues');

const connection = createRedisConnection();

const defaultQueueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600 },
  },
};

const queues: Record<QueueName, Queue> = {
  [QueueName.EMAIL]: new Queue(QueueName.EMAIL, defaultQueueOptions),
  [QueueName.NOTIFICATION]: new Queue(QueueName.NOTIFICATION, defaultQueueOptions),
  [QueueName.REPORT]: new Queue(QueueName.REPORT, defaultQueueOptions),
  [QueueName.CLEANUP]: new Queue(QueueName.CLEANUP, defaultQueueOptions),
};

export function getQueue(name: QueueName): Queue {
  return queues[name];
}

export async function closeQueues(): Promise<void> {
  await Promise.all(Object.values(queues).map((queue) => queue.close()));
  await connection.quit();
  logger.info('All queues closed');
}
