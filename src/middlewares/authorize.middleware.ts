import { NextFunction, Request, Response } from 'express';
import { AuthenticationError, AuthorizationError } from '@utils/errors';
import { Role } from '@constants/roles.constant';
import { Permission, ROLE_PERMISSIONS } from '@constants/permissions.constant';

/** Restricts a route to one or more roles. Requires `authenticate` to run first. */
export const requireRole =
  (...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AuthenticationError();

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      throw new AuthorizationError(
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      );
    }
    next();
  };

/** Restricts a route to holders of a specific fine-grained permission. */
export const requirePermission =
  (permission: Permission) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AuthenticationError();

    const userPermissions = new Set(req.user.roles.flatMap((role) => ROLE_PERMISSIONS[role]));
    if (!userPermissions.has(permission)) {
      throw new AuthorizationError(`Missing required permission: ${permission}`);
    }
    next();
  };

/** Allows access if the requester owns the resource OR holds one of the given roles. */
export const requireOwnershipOrRole =
  (getOwnerId: (req: Request) => string, ...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AuthenticationError();

    const isOwner = getOwnerId(req) === req.user.id;
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!isOwner && !hasRole) {
      throw new AuthorizationError('You do not have permission to access this resource');
    }
    next();
  };
