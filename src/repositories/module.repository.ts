import { Module, Prisma } from '@prisma/client';
import { prisma } from '@config/database';

class ModuleRepository {
  findByCourse(courseId: string): Promise<Module[]> {
    return prisma.module.findMany({ where: { courseId }, orderBy: { sortOrder: 'asc' } });
  }

  findById(id: string): Promise<Module | null> {
    return prisma.module.findUnique({ where: { id } });
  }

  async nextSortOrder(courseId: string): Promise<number> {
    const last = await prisma.module.findFirst({ where: { courseId }, orderBy: { sortOrder: 'desc' } });
    return (last?.sortOrder ?? -1) + 1;
  }

  create(data: Prisma.ModuleCreateInput): Promise<Module> {
    return prisma.module.create({ data });
  }

  update(id: string, data: Prisma.ModuleUpdateInput): Promise<Module> {
    return prisma.module.update({ where: { id }, data });
  }

  delete(id: string): Promise<Module> {
    return prisma.module.delete({ where: { id } });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await prisma.$transaction(
      orderedIds.map((id, index) => prisma.module.update({ where: { id }, data: { sortOrder: index } })),
    );
  }
}

export const moduleRepository = new ModuleRepository();
