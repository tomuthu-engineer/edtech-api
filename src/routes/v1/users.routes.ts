import { Router } from 'express';
import { userController } from '@controllers/user.controller';
import { authenticate } from '@middlewares/authenticate.middleware';
import { requireRole } from '@middlewares/authorize.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { directUpload } from '@middlewares/upload.middleware';
import { STAFF_ROLES } from '@constants/roles.constant';
import {
  listUsersValidator,
  userIdParamValidator,
  updateProfileValidator,
  updateUserStatusValidator,
  updateUserRolesValidator,
} from '@validators/user.validator';

export const usersRouter = Router();

usersRouter.use(authenticate);

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the current user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
usersRouter.get('/me', userController.me);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update the current user's profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateProfileBody' }
 *     responses: { 200: { description: Updated } }
 */
usersRouter.patch('/me', validateRequest(updateProfileValidator), userController.updateMe);

/**
 * @openapi
 * /users/me/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload/replace the current user's avatar
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses: { 200: { description: Avatar updated } }
 */
usersRouter.post('/me/avatar', directUpload.single('file'), userController.updateMyAvatar);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List/search users (staff only)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
usersRouter.get('/', requireRole(...STAFF_ROLES), validateRequest(listUsersValidator), userController.list);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by id (staff only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Users]
 *     summary: Soft-delete a user (staff only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses: { 200: { description: Deleted } }
 */
usersRouter.get('/:id', requireRole(...STAFF_ROLES), validateRequest(userIdParamValidator), userController.getById);

/**
 * @openapi
 * /users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Suspend/ban/activate/deactivate a user (staff only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateUserStatusBody' }
 *     responses: { 200: { description: Status updated } }
 */
usersRouter.patch(
  '/:id/status',
  requireRole(...STAFF_ROLES),
  validateRequest(updateUserStatusValidator),
  userController.updateStatus,
);

/**
 * @openapi
 * /users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Assign or remove a role from a user (staff only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateUserRoleBody' }
 *     responses: { 200: { description: Role updated } }
 */
usersRouter.patch(
  '/:id/role',
  requireRole(...STAFF_ROLES),
  validateRequest(updateUserRolesValidator),
  userController.updateRole,
);

usersRouter.delete(
  '/:id',
  requireRole(...STAFF_ROLES),
  validateRequest(userIdParamValidator),
  userController.remove,
);
