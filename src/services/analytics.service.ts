import { prisma } from '@config/database';
import { CourseStatus, EnrollmentStatus, LiveSessionStatus, ReportStatus } from '@prisma/client';
import { getOrSetCache, CacheKey } from '@lib/cache';

const DASHBOARD_CACHE_TTL_SECONDS = 60;

/**
 * Read-only aggregate queries backing the admin dashboard and the async
 * report-generation job. Kept isolated from transactional repositories
 * since these are analytical (groupBy/aggregate) rather than CRUD.
 */
class AnalyticsService {
  async getDashboardMetrics() {
    return getOrSetCache(CacheKey.dashboardMetrics(), DASHBOARD_CACHE_TTL_SECONDS, async () => {
      const [totalStudents, totalCourses, publishedCourses, totalEnrollments, activeLiveSessions, pendingReports] =
        await Promise.all([
          prisma.user.count({ where: { roles: { some: { role: { name: 'STUDENT' } } } } }),
          prisma.course.count(),
          prisma.course.count({ where: { status: CourseStatus.PUBLISHED } }),
          prisma.enrollment.count({ where: { status: EnrollmentStatus.ACTIVE } }),
          prisma.liveSession.count({ where: { status: LiveSessionStatus.LIVE } }),
          prisma.report.count({ where: { status: ReportStatus.PENDING } }),
        ]);

      return { totalStudents, totalCourses, publishedCourses, totalEnrollments, activeLiveSessions, pendingReports };
    });
  }

  async getCourseAnalytics() {
    const [byStatus, topEnrolled, averageRating] = await Promise.all([
      prisma.course.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.course.findMany({
        orderBy: { enrollmentCount: 'desc' },
        take: 10,
        select: { id: true, title: true, enrollmentCount: true, averageRating: true },
      }),
      prisma.course.aggregate({ _avg: { averageRating: true } }),
    ]);

    return { byStatus, topEnrolled, averageRating: averageRating._avg.averageRating ?? 0 };
  }

  async getStudentAnalytics() {
    const [totalStudents, newLast30Days, byStatus] = await Promise.all([
      prisma.user.count({ where: { roles: { some: { role: { name: 'STUDENT' } } } } }),
      prisma.user.count({
        where: {
          roles: { some: { role: { name: 'STUDENT' } } },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    return { totalStudents, newLast30Days, byStatus };
  }

  async getCommunityAnalytics() {
    const [totalPosts, totalComments, totalReplies, pendingReports] = await Promise.all([
      prisma.communityPost.count({ where: { isDeleted: false } }),
      prisma.communityComment.count({ where: { isDeleted: false } }),
      prisma.communityReply.count({ where: { isDeleted: false } }),
      prisma.report.count({ where: { status: ReportStatus.PENDING } }),
    ]);

    return { totalPosts, totalComments, totalReplies, pendingReports };
  }

  async getLiveClassAnalytics() {
    const [byStatus, upcoming, totalAttendance] = await Promise.all([
      prisma.liveSession.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.liveSession.count({
        where: { status: LiveSessionStatus.SCHEDULED, scheduledStart: { gte: new Date() } },
      }),
      prisma.liveAttendee.count(),
    ]);

    return { byStatus, upcoming, totalAttendance };
  }

  async getRecentActivity(limit = 20) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }
}

export const analyticsService = new AnalyticsService();
