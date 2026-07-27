import { Router } from 'express';
import { enrollmentController } from '@controllers/enrollment.controller';
import { authenticate } from '@middlewares/authenticate.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import {
  courseIdParamValidator,
  listEnrollmentsValidator,
  listCourseRosterValidator,
} from '@validators/enrollment.validator';

export const enrollmentsRouter = Router();

enrollmentsRouter.use(authenticate);

/**
 * @openapi
 * /enrollments/me:
 *   get:
 *     tags: [Enrollments]
 *     summary: List the current user's enrollments
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
enrollmentsRouter.get('/me', validateRequest(listEnrollmentsValidator), enrollmentController.listMine);

/**
 * @openapi
 * /enrollments/{courseId}:
 *   post:
 *     tags: [Enrollments]
 *     summary: Enroll the current user in a course
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdParam'
 *     responses: { 201: { description: Enrolled } }
 *   delete:
 *     tags: [Enrollments]
 *     summary: Cancel the current user's enrollment in a course
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdParam'
 *     responses: { 200: { description: Cancelled } }
 */
enrollmentsRouter.post('/:courseId', validateRequest(courseIdParamValidator), enrollmentController.enroll);
enrollmentsRouter.delete('/:courseId', validateRequest(courseIdParamValidator), enrollmentController.cancel);

/**
 * @openapi
 * /enrollments/{courseId}/roster:
 *   get:
 *     tags: [Enrollments]
 *     summary: List a course's enrolled students (course owner or staff)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdParam'
 *     responses: { 200: { description: OK } }
 */
enrollmentsRouter.get(
  '/:courseId/roster',
  validateRequest(listCourseRosterValidator),
  enrollmentController.listForCourse,
);
