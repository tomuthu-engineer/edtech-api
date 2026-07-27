import { Job, Worker } from 'bullmq';
import { FileEntityType, NotificationType } from '@prisma/client';
import { createRedisConnection } from '@config/redis';
import { QueueName } from '@queues/queueNames.constant';
import { ReportGenerationJobData } from '@queues/jobPayloads.types';
import { analyticsService } from '@services/analytics.service';
import { storageService } from '@storage/storage.service';
import { fileAssetRepository } from '@repositories/fileAsset.repository';
import { notificationService } from '@services/notification.service';
import { createChildLogger } from '@config/logger';

const logger = createChildLogger('worker:report');

async function collectReportData(reportType: ReportGenerationJobData['reportType']) {
  switch (reportType) {
    case 'COURSE_ANALYTICS':
      return analyticsService.getCourseAnalytics();
    case 'STUDENT_ANALYTICS':
      return analyticsService.getStudentAnalytics();
    case 'COMMUNITY_ANALYTICS':
      return analyticsService.getCommunityAnalytics();
    case 'LIVE_CLASS_ANALYTICS':
      return analyticsService.getLiveClassAnalytics();
    default:
      throw new Error(`Unknown report type: ${reportType as string}`);
  }
}

export function createReportWorker(): Worker<ReportGenerationJobData> {
  return new Worker<ReportGenerationJobData>(
    QueueName.REPORT,
    async (job: Job<ReportGenerationJobData>) => {
      const data = await collectReportData(job.data.reportType);
      const payload = JSON.stringify({ reportType: job.data.reportType, generatedAt: new Date().toISOString(), data }, null, 2);
      const buffer = Buffer.from(payload, 'utf-8');

      const uploadResult = await storageService.upload({
        buffer,
        originalName: `${job.data.reportType.toLowerCase()}-${Date.now()}.json`,
        mimeType: 'application/json',
        size: buffer.byteLength,
        entityType: FileEntityType.TEMPORARY,
        uploadedBy: job.data.requestedBy,
      });

      const asset = await fileAssetRepository.create({
        originalName: uploadResult.originalName,
        fileName: uploadResult.fileName,
        bucket: uploadResult.bucket,
        key: uploadResult.key,
        url: uploadResult.url,
        entityType: FileEntityType.TEMPORARY,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        extension: uploadResult.extension,
        isPublic: uploadResult.isPublic,
        uploader: { connect: { id: job.data.requestedBy } },
      });

      await notificationService.dispatch({
        userIds: [job.data.requestedBy],
        type: NotificationType.SYSTEM,
        title: 'Report ready',
        body: `Your ${job.data.reportType.replace('_', ' ').toLowerCase()} report has finished generating.`,
        actionUrl: `/storage/${asset.id}/signed-download-url`,
      });

      return { fileAssetId: asset.id };
    },
    { connection: createRedisConnection(), concurrency: 2 },
  )
    .on('completed', (job) => logger.info({ jobId: job.id }, 'Report job completed'))
    .on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Report job failed'));
}
