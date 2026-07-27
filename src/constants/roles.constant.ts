export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  MODERATOR = 'MODERATOR',
  STUDENT = 'STUDENT',
  FUTURE_READY = 'FUTURE_READY',
}

/** Roles with full or near-full back-office access. */
export const STAFF_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN];

/** Roles permitted to manage content moderation. */
export const MODERATION_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR];

/** Roles permitted to author/manage course content. */
export const CONTENT_MANAGEMENT_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR];

export const ALL_ROLES: Role[] = Object.values(Role);
