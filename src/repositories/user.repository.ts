import { Prisma, User } from '@prisma/client';
import { prisma } from '@config/database';
import { Role } from '@constants/roles.constant';
import { toSkipTake, PaginationQuery } from '@utils/pagination';

export const userWithRolesInclude = {
  roles: { include: { role: true } },
} satisfies Prisma.UserInclude;

export type UserWithRoles = Prisma.UserGetPayload<{ include: typeof userWithRolesInclude }>;

export interface UserListFilters extends PaginationQuery {
  search?: string;
  role?: Role;
  status?: string;
}

class UserRepository {
  findByEmail(email: string): Promise<UserWithRoles | null> {
    return prisma.user.findUnique({ where: { email }, include: userWithRolesInclude });
  }

  findById(id: string): Promise<UserWithRoles | null> {
    return prisma.user.findUnique({ where: { id }, include: userWithRolesInclude });
  }

  findByIdOrThrowNull(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    roleNames: Role[];
  }): Promise<UserWithRoles> {
    return prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
        roles: {
          create: data.roleNames.map((roleName) => ({
            role: { connect: { name: roleName } },
          })),
        },
      },
      include: userWithRolesInclude,
    });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  async markEmailVerified(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { isEmailVerified: true, status: 'ACTIVE' },
    });
  }

  async recordLogin(id: string, ip: string | undefined): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });
  }

  async assignRole(userId: string, roleName: Role): Promise<void> {
    const roleId = await this.roleId(roleName);
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  async removeRole(userId: string, roleName: Role): Promise<void> {
    const roleId = await this.roleId(roleName);
    await prisma.userRole.deleteMany({ where: { userId, roleId } });
  }

  private async roleId(roleName: Role): Promise<string> {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    return role.id;
  }

  async findMany(filters: UserListFilters) {
    const { skip, take, page, limit } = toSkipTake(filters);

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(filters.search
        ? {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filters.role ? { roles: { some: { role: { name: filters.role } } } } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: userWithRolesInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async softDelete(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date(), status: 'DEACTIVATED' } });
  }
}

export const userRepository = new UserRepository();

export function toRoleNames(user: UserWithRoles): Role[] {
  return user.roles.map((userRole) => userRole.role.name as Role);
}
