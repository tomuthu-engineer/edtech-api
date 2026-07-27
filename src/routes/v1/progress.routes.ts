import { Router } from 'express';
import { progressController } from '@controllers/progress.controller';
import { authenticate } from '@middlewares/authenticate.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import {
  lessonIdParamValidator,
  courseIdParamValidator,
  updateLessonProgressValidator,
} from '@validators/progress.validator';

export const progressRouter = Router();

progressRouter.use(authenticate);

/**
 * @openapi
 * /progress:
 *   get:
 *     tags: [Progress]
 *     summary: List the current user's course progress across all enrollments
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
progressRouter.get('/', progressController.listMine);

/**
 * @openapi
 * /progress/courses/{courseId}:
 *   get:
 *     tags: [Progress]
 *     summary: Get the current user's progress for a specific course
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdParam'
 *     responses: { 200: { description: OK } }
 */
progressRouter.get('/courses/:courseId', validateRequest(courseIdParamValidator), progressController.getCourseProgress);

/**
 * @openapi
 * /progress/lessons/{lessonId}:
 *   get:
 *     tags: [Progress]
 *     summary: Get the current user's progress for a specific lesson
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/LessonIdParam'
 *     responses: { 200: { description: OK } }
 *   patch:
 *     tags: [Progress]
 *     summary: Update watch time / completion status for a lesson
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/LessonIdParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateLessonProgressBody' }
 *     responses: { 200: { description: Progress updated } }
 */
progressRouter.get('/lessons/:lessonId', validateRequest(lessonIdParamValidator), progressController.getLessonProgress);
progressRouter.patch(
  '/lessons/:lessonId',
  validateRequest(updateLessonProgressValidator),
  progressController.updateLessonProgress,
);
