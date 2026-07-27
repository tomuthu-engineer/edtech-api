import { getQueue } from '@queues/index';
import { QueueName } from '@queues/queueNames.constant';
import { ReportGenerationJobData } from '@queues/jobPayloads.types';

export async function enqueueReportGeneration(data: ReportGenerationJobData): Promise<void> {
  await getQueue(QueueName.REPORT).add('generate-report', data);
}
