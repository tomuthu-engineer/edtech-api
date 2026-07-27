import { Router } from 'express';
import { searchController } from '@controllers/search.controller';
import { authenticate } from '@middlewares/authenticate.middleware';
import { requireRole } from '@middlewares/authorize.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { STAFF_ROLES } from '@constants/roles.constant';
import { searchValidator } from '@validators/search.validator';

export const searchRouter = Router();

/**
 * @openapi
 * /search/courses:
 *   get:
 *     tags: [Search]
 *     summary: Search published courses
 *     responses: { 200: { description: OK } }
 */
searchRouter.get('/courses', validateRequest(searchValidator), searchController.courses);
searchRouter.get('/community', authenticate, validateRequest(searchValidator), searchController.community);
searchRouter.get('/live', authenticate, validateRequest(searchValidator), searchController.live);

searchRouter.get(
  '/students',
  authenticate,
  requireRole(...STAFF_ROLES),
  validateRequest(searchValidator),
  searchController.students,
);
