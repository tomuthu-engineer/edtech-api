import { Router } from 'express';
import { liveController } from '@controllers/live.controller';
import { authenticate } from '@middlewares/authenticate.middleware';
import { requireRole } from '@middlewares/authorize.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { CONTENT_MANAGEMENT_ROLES } from '@constants/roles.constant';
import {
  liveIdParamValidator,
  listLiveSessionsValidator,
  scheduleLiveSessionValidator,
  endLiveSessionValidator,
  joinLiveSessionValidator,
} from '@validators/live.validator';

export const liveRouter = Router();

liveRouter.use(authenticate);

/**
 * @openapi
 * /live:
 *   get:
 *     tags: [Live Classes]
 *     summary: List live sessions (upcoming/live/completed/cancelled)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Live Classes]
 *     summary: Schedule a new live session
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ScheduleLiveSessionBody' }
 *     responses: { 201: { description: Scheduled } }
 */
liveRouter.get('/', validateRequest(listLiveSessionsValidator), liveController.list);
liveRouter.post(
  '/',
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(scheduleLiveSessionValidator),
  liveController.schedule,
);

/**
 * @openapi
 * /live/{id}:
 *   get:
 *     tags: [Live Classes]
 *     summary: Get a live session by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: OK } }
 */
liveRouter.get('/:id', validateRequest(liveIdParamValidator), liveController.getById);

/**
 * @openapi
 * /live/{id}/start:
 *   post:
 *     tags: [Live Classes]
 *     summary: Start a scheduled live session (host or staff)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: Started } }
 */
liveRouter.post(
  '/:id/start',
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(liveIdParamValidator),
  liveController.start,
);

/**
 * @openapi
 * /live/{id}/end:
 *   post:
 *     tags: [Live Classes]
 *     summary: End a live session, optionally attaching the recording key
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EndLiveSessionBody' }
 *     responses: { 200: { description: Ended } }
 */
liveRouter.post(
  '/:id/end',
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(endLiveSessionValidator),
  liveController.end,
);

/**
 * @openapi
 * /live/{id}/cancel:
 *   post:
 *     tags: [Live Classes]
 *     summary: Cancel a scheduled live session (host or staff)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: Cancelled } }
 */
liveRouter.post(
  '/:id/cancel',
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(liveIdParamValidator),
  liveController.cancel,
);

/**
 * @openapi
 * /live/{id}/join:
 *   post:
 *     tags: [Live Classes]
 *     summary: Join a live session — returns a provider access token
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/JoinLiveSessionBody' }
 *     responses: { 200: { description: Join token issued } }
 */
liveRouter.post('/:id/join', validateRequest(joinLiveSessionValidator), liveController.join);

/**
 * @openapi
 * /live/{id}/leave:
 *   post:
 *     tags: [Live Classes]
 *     summary: Record the current user leaving a live session
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: Left } }
 */
liveRouter.post('/:id/leave', validateRequest(liveIdParamValidator), liveController.leave);

/**
 * @openapi
 * /live/{id}/attendance:
 *   get:
 *     tags: [Live Classes]
 *     summary: List attendees for a live session (host or staff)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: OK } }
 */
liveRouter.get(
  '/:id/attendance',
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(liveIdParamValidator),
  liveController.attendance,
);
