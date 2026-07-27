import { Router } from 'express';
import { notificationController } from '@controllers/notification.controller';
import { authenticate } from '@middlewares/authenticate.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { listNotificationsValidator, userNotificationIdParamValidator } from '@validators/notification.validator';

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List the current user's notifications
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
notificationsRouter.get('/', validateRequest(listNotificationsValidator), notificationController.list);
notificationsRouter.get('/unread-count', notificationController.unreadCount);
notificationsRouter.patch('/read-all', notificationController.markAllRead);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: Marked read } }
 */
notificationsRouter.patch('/:id/read', validateRequest(userNotificationIdParamValidator), notificationController.markRead);

/**
 * @openapi
 * /notifications/{id}/archive:
 *   patch:
 *     tags: [Notifications]
 *     summary: Archive a notification
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: Archived } }
 */
notificationsRouter.patch('/:id/archive', validateRequest(userNotificationIdParamValidator), notificationController.archive);
