import { Role } from '@constants/roles.constant';

/**
 * Fine-grained permission strings, grouped by domain.
 * Roles map to a set of these via ROLE_PERMISSIONS for use by the
 * `permission` middleware where role-level checks are too coarse.
 */
export enum Permission {
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',

  COURSE_READ = 'course:read',
  COURSE_WRITE = 'course:write',
  COURSE_PUBLISH = 'course:publish',
  COURSE_DELETE = 'course:delete',

  LIVE_CREATE = 'live:create',
  LIVE_MANAGE = 'live:manage',

  COMMUNITY_MODERATE = 'community:moderate',
  COMMUNITY_PIN = 'community:pin',

  SETTINGS_MANAGE = 'settings:manage',
  ANALYTICS_READ = 'analytics:read',
  AUDIT_READ = 'audit:read',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_MANAGE_ROLES,
    Permission.COURSE_READ,
    Permission.COURSE_WRITE,
    Permission.COURSE_PUBLISH,
    Permission.COURSE_DELETE,
    Permission.LIVE_CREATE,
    Permission.LIVE_MANAGE,
    Permission.COMMUNITY_MODERATE,
    Permission.COMMUNITY_PIN,
    Permission.SETTINGS_MANAGE,
    Permission.ANALYTICS_READ,
    Permission.AUDIT_READ,
  ],
  [Role.INSTRUCTOR]: [
    Permission.COURSE_READ,
    Permission.COURSE_WRITE,
    Permission.LIVE_CREATE,
    Permission.LIVE_MANAGE,
    Permission.ANALYTICS_READ,
  ],
  [Role.MODERATOR]: [
    Permission.USER_READ,
    Permission.COURSE_READ,
    Permission.COMMUNITY_MODERATE,
    Permission.COMMUNITY_PIN,
  ],
  [Role.STUDENT]: [Permission.COURSE_READ],
  [Role.FUTURE_READY]: [Permission.COURSE_READ],
};
