export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

export interface NotificationJobData {
  userIds: string[];
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  createdBy?: string;
}

export interface ReportGenerationJobData {
  reportType: 'COURSE_ANALYTICS' | 'STUDENT_ANALYTICS' | 'COMMUNITY_ANALYTICS' | 'LIVE_CLASS_ANALYTICS';
  requestedBy: string;
  filters?: Record<string, unknown>;
}

export interface CleanupJobData {
  task: 'EXPIRED_REFRESH_TOKENS' | 'EXPIRED_OTPS' | 'TEMPORARY_FILES' | 'STALE_NOTIFICATIONS';
}
