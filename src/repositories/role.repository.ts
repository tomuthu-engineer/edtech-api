import { Role as RoleModel } from '@prisma/client';
import { prisma } from '@config/database';
import { Role } from '@constants/roles.constant';

class RoleRepository {
  findByName(name: Role): Promise<RoleModel | null> {
    return prisma.role.findUnique({ where: { name } });
  }

  findAll(): Promise<RoleModel[]> {
    return prisma.role.findMany({ orderBy: { name: 'asc' } });
  }
}

export const roleRepository = new RoleRepository();
