import { Router } from 'express';
import { categoryController } from '@controllers/category.controller';
import { authenticate } from '@middlewares/authenticate.middleware';
import { requireRole } from '@middlewares/authorize.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { STAFF_ROLES } from '@constants/roles.constant';
import {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdParamValidator,
  listCategoriesValidator,
} from '@validators/category.validator';

export const categoriesRouter = Router();

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List course categories
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Categories]
 *     summary: Create a category (staff only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCategoryBody' }
 *     responses: { 201: { description: Created } }
 */
categoriesRouter.get('/', validateRequest(listCategoriesValidator), categoryController.list);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a category by id
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: OK } }
 */
categoriesRouter.get('/:id', validateRequest(categoryIdParamValidator), categoryController.getById);

categoriesRouter.post(
  '/',
  authenticate,
  requireRole(...STAFF_ROLES),
  validateRequest(createCategoryValidator),
  categoryController.create,
);

/**
 * @openapi
 * /categories/{id}:
 *   patch:
 *     tags: [Categories]
 *     summary: Update a category (staff only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCategoryBody' }
 *     responses: { 200: { description: Updated } }
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category (staff only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: Deleted } }
 */
categoriesRouter.patch(
  '/:id',
  authenticate,
  requireRole(...STAFF_ROLES),
  validateRequest(updateCategoryValidator),
  categoryController.update,
);

categoriesRouter.delete(
  '/:id',
  authenticate,
  requireRole(...STAFF_ROLES),
  validateRequest(categoryIdParamValidator),
  categoryController.remove,
);
