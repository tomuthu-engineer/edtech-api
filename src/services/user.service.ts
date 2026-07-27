import { AccountStatus, FileEntityType } from '@prisma/client';
import { userRepository, UserListFilters } from '@repositories/user.repository';
import { auditLogService } from '@services/auditLog.service';
import { storageService } from '@storage/storage.service';
import { toSanitizedUser } from '@utils/mappers/user.mapper';
import { NotFoundError, ValidationError } from '@utils/errors';
import { Role } from '@constants/roles.constant';

interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
}

interface ActorContext {
  actorId: string;
  ipAddress?: string;
  userAgent?: string;
}

class UserService {
  async list(filters: UserListFilters) {
    const { items, total, page, limit } = await userRepository.findMany(filters);
    return { items: items.map(toSanitizedUser), total, page, limit };
  }

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User');
    return toSanitizedUser(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const updated = await userRepository.update(userId, input);
    const withRoles = await userRepository.findById(updated.id);
    return toSanitizedUser(withRoles!);
  }

  async updateAvatar(userId: string, file: { buffer: Buffer; originalName: string; mimeType: string; size: number }) {
    const current = await userRepository.findByIdOrThrowNull(userId);
    if (!current) throw new NotFoundError('User');

    const uploadResult = await storageService.replace(current.avatarKey, {
      ...file,
      entityType: FileEntityType.USER_PROFILE,
      uploadedBy: userId,
    });

    await userRepository.update(userId, { avatarKey: uploadResult.key });
    const withRoles = await userRepository.findById(userId);
    return toSanitizedUser(withRoles!);
  }

  async updateStatus(targetUserId: string, status: AccountStatus, actor: ActorContext) {
    const target = await userRepository.findByIdOrThrowNull(targetUserId);
    if (!target) throw new NotFoundError('User');

    await userRepository.update(targetUserId, { status });

    await auditLogService.record({
      actorId: actor.actorId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: targetUserId,
      metadata: { field: 'status', from: target.status, to: status },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    const withRoles = await userRepository.findById(targetUserId);
    return toSanitizedUser(withRoles!);
  }

  async updateRole(targetUserId: string, role: Role, action: 'ASSIGN' | 'REMOVE', actor: ActorContext) {
    const target = await userRepository.findById(targetUserId);
    if (!target) throw new NotFoundError('User');

    if (action === 'REMOVE' && target.roles.length === 1 && target.roles[0].role.name === role) {
      throw new ValidationError('Cannot remove the only role a user has');
    }

    if (action === 'ASSIGN') {
      await userRepository.assignRole(targetUserId, role);
    } else {
      await userRepository.removeRole(targetUserId, role);
    }

    await auditLogService.record({
      actorId: actor.actorId,
      action: 'ROLE_CHANGE',
      entityType: 'User',
      entityId: targetUserId,
      metadata: { role, action },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    const withRoles = await userRepository.findById(targetUserId);
    return toSanitizedUser(withRoles!);
  }

  async remove(targetUserId: string, actor: ActorContext) {
    const target = await userRepository.findByIdOrThrowNull(targetUserId);
    if (!target) throw new NotFoundError('User');

    await userRepository.softDelete(targetUserId);

    await auditLogService.record({
      actorId: actor.actorId,
      action: 'DELETE',
      entityType: 'User',
      entityId: targetUserId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  }
}

export const userService = new UserService();
