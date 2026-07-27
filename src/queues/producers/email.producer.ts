import { getQueue } from '@queues/index';
import { QueueName } from '@queues/queueNames.constant';
import { EmailJobData } from '@queues/jobPayloads.types';

export async function enqueueEmail(data: EmailJobData): Promise<void> {
  await getQueue(QueueName.EMAIL).add('send-email', data);
}
