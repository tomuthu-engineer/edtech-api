import { ReportStatus, ReportTargetType } from '@prisma/client';
import { reportRepository } from '@repositories/report.repository';
import { auditLogService } from '@services/auditLog.service';
import { NotFoundError, ValidationError } from '@utils/errors';
import { PaginationQuery } from '@utils/pagination';

interface CreateReportInput {
  targetType: ReportTargetType;
  postId?: string;
  commentId?: string;
  replyId?: string;
  reportedUserId?: string;
  reason: string;
}

class ReportService {
  async create(reporterId: string, input: CreateReportInput) {
    const targetKeyByType: Record<ReportTargetType, string | undefined> = {
      POST: input.postId,
      COMMENT: input.commentId,
      REPLY: input.replyId,
      USER: input.reportedUserId,
    };

    if (!targetKeyByType[input.targetType]) {
      throw new ValidationError(`A target id is required for report type ${input.targetType}`);
    }

    return reportRepository.create({
      reason: input.reason,
      targetType: input.targetType,
      reporter: { connect: { id: reporterId } },
      ...(input.postId ? { post: { connect: { id: input.postId } } } : {}),
      ...(input.commentId ? { comment: { connect: { id: input.commentId } } } : {}),
      ...(input.replyId ? { reply: { connect: { id: input.replyId } } } : {}),
      ...(input.reportedUserId ? { reportedUserId: input.reportedUserId } : {}),
    });
  }

  list(query: PaginationQuery & { status?: ReportStatus; targetType?: ReportTargetType }) {
    return reportRepository.findMany(query);
  }

  async resolve(id: string, reviewerId: string, status: ReportStatus, resolutionNote?: string) {
    const report = await reportRepository.findById(id);
    if (!report) throw new NotFoundError('Report');

    const updated = await reportRepository.resolve(id, status, reviewerId, resolutionNote);

    await auditLogService.record({
      actorId: reviewerId,
      action: 'MODERATE',
      entityType: 'Report',
      entityId: id,
      metadata: { status, resolutionNote },
    });

    return updated;
  }
}

export const reportService = new ReportService();
