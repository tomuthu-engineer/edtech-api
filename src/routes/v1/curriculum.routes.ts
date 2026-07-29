import { Router } from 'express';
import { curriculumController } from '@controllers/curriculum.controller';
import { authenticate } from '@middlewares/authenticate.middleware';
import { requireRole } from '@middlewares/authorize.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { directUpload } from '@middlewares/upload.middleware';
import { CONTENT_MANAGEMENT_ROLES } from '@constants/roles.constant';
import {
  moduleIdParamValidator,
  updateModuleValidator,
  createLessonValidator,
  reorderLessonsValidator,
  lessonIdParamValidator,
  updateLessonValidator,
  attachLessonVideoValidator,
  createResourceValidator,
  resourceIdParamValidator,
} from '@validators/curriculum.validator';

const staffOnly = [authenticate, requireRole(...CONTENT_MANAGEMENT_ROLES)];

// ---- /modules/:moduleId ----------------------------------------------------

export const modulesRouter = Router();

/**
 * @openapi
 * /modules/{moduleId}:
 *   patch:
 *     tags: [Modules & Lessons]
 *     summary: Update a module
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ModuleIdParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateModuleBody' }
 *     responses: { 200: { description: Updated } }
 *   delete:
 *     tags: [Modules & Lessons]
 *     summary: Delete a module
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ModuleIdParam'
 *     responses: { 200: { description: Deleted } }
 */
modulesRouter.patch(
  '/:moduleId',
  ...staffOnly,
  validateRequest(updateModuleValidator),
  curriculumController.updateModule,
);

modulesRouter.delete(
  '/:moduleId',
  ...staffOnly,
  validateRequest(moduleIdParamValidator),
  curriculumController.deleteModule,
);

/**
 * @openapi
 * /modules/{moduleId}/lessons:
 *   get:
 *     tags: [Modules & Lessons]
 *     summary: List a module's lessons
 *     parameters:
 *       - $ref: '#/components/parameters/ModuleIdParam'
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Modules & Lessons]
 *     summary: Add a lesson to a module
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ModuleIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateLessonBody' }
 *     responses: { 201: { description: Created } }
 */
modulesRouter.get(
  '/:moduleId/lessons',
  validateRequest(moduleIdParamValidator),
  curriculumController.listLessons,
);

modulesRouter.post(
  '/:moduleId/lessons',
  ...staffOnly,
  validateRequest(createLessonValidator),
  curriculumController.createLesson,
);

/**
 * @openapi
 * /modules/{moduleId}/lessons/reorder:
 *   patch:
 *     tags: [Modules & Lessons]
 *     summary: Reorder a module's lessons
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ModuleIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReorderLessonsBody' }
 *     responses: { 200: { description: Reordered } }
 */
modulesRouter.patch(
  '/:moduleId/lessons/reorder',
  ...staffOnly,
  validateRequest(reorderLessonsValidator),
  curriculumController.reorderLessons,
);

// ---- /lessons/:lessonId -----------------------------------------------------

export const lessonsRouter = Router();

/**
 * @openapi
 * /lessons/{lessonId}:
 *   patch:
 *     tags: [Modules & Lessons]
 *     summary: Update a lesson
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/LessonIdParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateLessonBody' }
 *     responses: { 200: { description: Updated } }
 *   delete:
 *     tags: [Modules & Lessons]
 *     summary: Delete a lesson
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/LessonIdParam'
 *     responses: { 200: { description: Deleted } }
 */
lessonsRouter.patch(
  '/:lessonId',
  ...staffOnly,
  validateRequest(updateLessonValidator),
  curriculumController.updateLesson,
);

lessonsRouter.delete(
  '/:lessonId',
  ...staffOnly,
  validateRequest(lessonIdParamValidator),
  curriculumController.deleteLesson,
);

/**
 * @openapi
 * /lessons/{lessonId}/video-url:
 *   get:
 *     tags: [Modules & Lessons]
 *     summary: Get a signed, time-limited playback URL for the lesson video
 *     description: Gated by enrollment unless the lesson is a preview or the requester is staff/the course owner.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/LessonIdParam'
 *     responses: { 200: { description: OK }, 403: { description: Not enrolled } }
 */
lessonsRouter.get(
  '/:lessonId/video-url',
  authenticate,
  validateRequest(lessonIdParamValidator),
  curriculumController.getLessonVideoUrl,
);

/**
 * @openapi
 * /lessons/{lessonId}/video:
 *   post:
 *     tags: [Modules & Lessons]
 *     summary: Step 3 — attach a lesson video after uploading it to S3 with a signed URL
 *     description: >
 *       Call this AFTER completing `POST /storage/signed-upload-url` (step 1)
 *       and `PUT`-ing the actual video file to the returned `uploadUrl`
 *       (step 2). The server verifies the `key` both starts with
 *       `uploads/lessons/videos/` and actually exists in S3 (a HEAD request)
 *       before saving it — a key with nothing uploaded behind it is rejected
 *       with 400, not silently accepted.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/LessonIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AttachLessonVideoBody' }
 *     responses:
 *       200: { description: Video attached }
 *       400: { description: "Key doesn't match the expected prefix, or no object exists at that key in S3" }
 */
lessonsRouter.post(
  '/:lessonId/video',
  ...staffOnly,
  validateRequest(attachLessonVideoValidator),
  curriculumController.attachLessonVideo,
);

/**
 * @openapi
 * /lessons/{lessonId}/thumbnail:
 *   post:
 *     tags: [Modules & Lessons]
 *     summary: Upload/replace the lesson thumbnail image
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/LessonIdParam'
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses: { 200: { description: Thumbnail uploaded } }
 */
lessonsRouter.post(
  '/:lessonId/thumbnail',
  ...staffOnly,
  validateRequest(lessonIdParamValidator),
  directUpload.single('file'),
  curriculumController.uploadLessonThumbnail,
);

/**
 * @openapi
 * /lessons/{lessonId}/resources:
 *   get:
 *     tags: [Modules & Lessons]
 *     summary: List a lesson's downloadable resources
 *     parameters:
 *       - $ref: '#/components/parameters/LessonIdParam'
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Modules & Lessons]
 *     summary: Add a resource to a lesson (file upload or externalUrl)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/LessonIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateResourceBody'
 *               - type: object
 *                 properties:
 *                   file: { type: string, format: binary }
 *     responses: { 201: { description: Created } }
 */
lessonsRouter.get(
  '/:lessonId/resources',
  validateRequest(lessonIdParamValidator),
  curriculumController.listResources,
);

lessonsRouter.post(
  '/:lessonId/resources',
  ...staffOnly,
  directUpload.single('file'),
  validateRequest(createResourceValidator),
  curriculumController.addResource,
);

// ---- /resources/:resourceId ------------------------------------------------

export const resourcesRouter = Router();

/**
 * @openapi
 * /resources/{resourceId}:
 *   delete:
 *     tags: [Modules & Lessons]
 *     summary: Remove a lesson resource
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceIdParam'
 *     responses: { 200: { description: Deleted } }
 */
resourcesRouter.delete(
  '/:resourceId',
  ...staffOnly,
  validateRequest(resourceIdParamValidator),
  curriculumController.removeResource,
);
