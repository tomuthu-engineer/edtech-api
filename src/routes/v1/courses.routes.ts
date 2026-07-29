import { Router } from 'express';
import { courseController } from '@controllers/course.controller';
import { curriculumController } from '@controllers/curriculum.controller';
import { authenticate, optionalAuthenticate } from '@middlewares/authenticate.middleware';
import { requireRole } from '@middlewares/authorize.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { directUpload } from '@middlewares/upload.middleware';
import { CONTENT_MANAGEMENT_ROLES } from '@constants/roles.constant';
import {
  listCoursesValidator,
  courseIdParamValidator,
  courseSlugParamValidator,
  createCourseValidator,
  updateCourseValidator,
  changeCourseStatusValidator,
} from '@validators/course.validator';
import {
  createModuleValidator,
  reorderModulesValidator,
  courseIdParamValidator as curriculumCourseIdParamValidator,
} from '@validators/curriculum.validator';

export const coursesRouter = Router();

/**
 * @openapi
 * /courses:
 *   get:
 *     tags: [Courses]
 *     summary: List/search courses (public sees published only)
 *     responses: { 200: { description: OK } }
 */
coursesRouter.get('/', optionalAuthenticate, validateRequest(listCoursesValidator), courseController.list);

/**
 * @openapi
 * /courses/slug/{slug}:
 *   get:
 *     tags: [Courses]
 *     summary: Get a published course by slug
 *     parameters:
 *       - $ref: '#/components/parameters/SlugParam'
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 */
coursesRouter.get('/slug/:slug', validateRequest(courseSlugParamValidator), courseController.getBySlug);

/**
 * @openapi
 * /courses/{id}:
 *   get:
 *     tags: [Courses]
 *     summary: Get a course by id, including its modules/lessons
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   patch:
 *     tags: [Courses]
 *     summary: Update a course (owner instructor or staff)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCourseBody' }
 *     responses: { 200: { description: Updated } }
 *   delete:
 *     tags: [Courses]
 *     summary: Soft-delete a course (owner instructor or staff)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: Deleted } }
 */
coursesRouter.get('/:id', validateRequest(courseIdParamValidator), courseController.getById);

/**
 * @openapi
 * /courses:
 *   post:
 *     tags: [Courses]
 *     summary: Create a course (instructor or staff)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCourseBody' }
 *     responses: { 201: { description: Created } }
 */
coursesRouter.post(
  '/',
  authenticate,
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(createCourseValidator),
  courseController.create,
);

coursesRouter.patch(
  '/:id',
  authenticate,
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(updateCourseValidator),
  courseController.update,
);

/**
 * @openapi
 * /courses/{id}/status:
 *   patch:
 *     tags: [Courses]
 *     summary: Change course lifecycle status (draft/published/archived)
 *     description: >
 *       Publishing (`status: PUBLISHED`) is blocked with 400 if the course
 *       has no lessons at all, or if any lesson with `contentType: VIDEO`
 *       in its curriculum has no video uploaded yet — upload via
 *       `POST /lessons/{lessonId}/video` first.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ChangeCourseStatusBody' }
 *     responses:
 *       200: { description: Status updated }
 *       400: { description: "Blocked: one or more VIDEO lessons have no video uploaded" }
 */
coursesRouter.patch(
  '/:id/status',
  authenticate,
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(changeCourseStatusValidator),
  courseController.changeStatus,
);

/**
 * @openapi
 * /courses/{id}/thumbnail:
 *   post:
 *     tags: [Courses]
 *     summary: Upload/replace the course thumbnail image
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses: { 200: { description: Thumbnail uploaded } }
 */
coursesRouter.post(
  '/:id/thumbnail',
  authenticate,
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(courseIdParamValidator),
  directUpload.single('file'),
  courseController.uploadThumbnail,
);

/**
 * @openapi
 * /courses/{id}/banner:
 *   post:
 *     tags: [Courses]
 *     summary: Upload/replace the course banner image
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses: { 200: { description: Banner uploaded } }
 */
coursesRouter.post(
  '/:id/banner',
  authenticate,
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(courseIdParamValidator),
  directUpload.single('file'),
  courseController.uploadBanner,
);

coursesRouter.delete(
  '/:id',
  authenticate,
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(courseIdParamValidator),
  courseController.remove,
);

// ---- Nested curriculum (modules) ------------------------------------------

/**
 * @openapi
 * /courses/{courseId}/modules:
 *   get:
 *     tags: [Modules & Lessons]
 *     summary: List a course's modules (with nested lessons)
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdParam'
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Modules & Lessons]
 *     summary: Add a module to a course
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateModuleBody' }
 *     responses: { 201: { description: Created } }
 */
coursesRouter.get(
  '/:courseId/modules',
  validateRequest(curriculumCourseIdParamValidator),
  curriculumController.listModules,
);

coursesRouter.post(
  '/:courseId/modules',
  authenticate,
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(createModuleValidator),
  curriculumController.createModule,
);

/**
 * @openapi
 * /courses/{courseId}/modules/reorder:
 *   patch:
 *     tags: [Modules & Lessons]
 *     summary: Reorder a course's modules
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReorderModulesBody' }
 *     responses: { 200: { description: Reordered } }
 */
coursesRouter.patch(
  '/:courseId/modules/reorder',
  authenticate,
  requireRole(...CONTENT_MANAGEMENT_ROLES),
  validateRequest(reorderModulesValidator),
  curriculumController.reorderModules,
);
