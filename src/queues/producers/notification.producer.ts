import { getQueue } from '@queues/index';
import { QueueName } from '@queues/queueNames.constant';
import { NotificationJobData } from '@queues/jobPayloads.types';

export async function enqueueNotification(data: NotificationJobData): Promise<void> {
  await getQueue(QueueName.NOTIFICATION).add('dispatch-notification', data);
}

/** Fires a notification some time in the future (e.g. "live class starts in 10 minutes"). */
export async function scheduleNotification(data: NotificationJobData, delayMs: number): Promise<void> {
  await getQueue(QueueName.NOTIFICATION).add('dispatch-notification', data, { delay: delayMs });
}
