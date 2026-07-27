import { Router } from 'express';
import { adminController } from '@controllers/admin.controller';
import { authenticate } from '@middlewares/authenticate.middleware';
import { requireRole, requirePermission } from '@middlewares/authorize.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { STAFF_ROLES } from '@constants/roles.constant';
import { Permission } from '@constants/permissions.constant';
import {
  listAuditLogsValidator,
  upsertSettingValidator,
  settingKeyParamValidator,
  listSettingsValidator,
  generateReportValidator,
} from '@validators/admin.validator';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole(...STAFF_ROLES));

/**
 * @openapi
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Platform-wide dashboard metrics
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
adminRouter.get('/dashboard', adminController.dashboard);
adminRouter.get('/analytics/courses', adminController.courseAnalytics);
adminRouter.get('/analytics/students', adminController.studentAnalytics);
adminRouter.get('/analytics/community', adminController.communityAnalytics);
adminRouter.get('/analytics/live-classes', adminController.liveClassAnalytics);
adminRouter.get('/activity', adminController.recentActivity);

/**
 * @openapi
 * /admin/reports/generate:
 *   post:
 *     tags: [Admin]
 *     summary: Kick off async analytics report generation (uploaded to S3, notifies requester when ready)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/GenerateReportBody' }
 *     responses: { 200: { description: Generation started } }
 */
adminRouter.post('/reports/generate', validateRequest(generateReportValidator), adminController.generateReport);

adminRouter.get(
  '/audit-logs',
  requirePermission(Permission.AUDIT_READ),
  validateRequest(listAuditLogsValidator),
  adminController.listAuditLogs,
);

adminRouter.get(
  '/settings',
  requirePermission(Permission.SETTINGS_MANAGE),
  validateRequest(listSettingsValidator),
  adminController.listSettings,
);

/**
 * @openapi
 * /admin/settings/{key}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a single platform setting by key
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/SettingKeyParam'
 *     responses: { 200: { description: OK } }
 *   put:
 *     tags: [Admin]
 *     summary: Create or update a platform setting by key
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/SettingKeyParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpsertSettingBody' }
 *     responses: { 200: { description: Saved } }
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a platform setting by key
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/SettingKeyParam'
 *     responses: { 200: { description: Deleted } }
 */
adminRouter.get(
  '/settings/:key',
  requirePermission(Permission.SETTINGS_MANAGE),
  validateRequest(settingKeyParamValidator),
  adminController.getSetting,
);
adminRouter.put(
  '/settings/:key',
  requirePermission(Permission.SETTINGS_MANAGE),
  validateRequest(upsertSettingValidator),
  adminController.upsertSetting,
);
adminRouter.delete(
  '/settings/:key',
  requirePermission(Permission.SETTINGS_MANAGE),
  validateRequest(settingKeyParamValidator),
  adminController.deleteSetting,
);
