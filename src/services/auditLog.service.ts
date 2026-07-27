import { AuditAction } from '@prisma/client';
import { auditLogRepository, CreateAuditLogInput } from '@repositories/auditLog.repository';
import { createChildLogger } from '@config/logger';

const logger = createChildLogger('audit');

class AuditLogService {
  /** Fire-and-forget: an audit-log write must never fail the business action it's recording. */
  async record(input: CreateAuditLogInput): Promise<void> {
    try {
      await auditLogRepository.create(input);
    } catch (err) {
      logger.error({ err, input }, 'Failed to write audit log');
    }
  }

  list(filters: Parameters<typeof auditLogRepository.findMany>[0]) {
    return auditLogRepository.findMany(filters);
  }
}

export const auditLogService = new AuditLogService();
export { AuditAction };
