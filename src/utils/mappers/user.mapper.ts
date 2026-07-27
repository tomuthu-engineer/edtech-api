import { UserWithRoles, toRoleNames } from '@repositories/user.repository';
import { SanitizedUser } from '@dto/auth.dto';
import { storageService } from '@storage/storage.service';

/** Strips sensitive fields (passwordHash etc.) and resolves the avatar to a public URL. */
export function toSanitizedUser(user: UserWithRoles): SanitizedUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarKey ? storageService.getPublicUrl(user.avatarKey) : null,
    roles: toRoleNames(user),
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
}
