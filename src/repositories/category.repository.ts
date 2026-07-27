import { Category, Prisma } from '@prisma/client';
import { prisma } from '@config/database';

class CategoryRepository {
  findAll(includeInactive = false): Promise<Category[]> {
    return prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  }

  findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { slug } });
  }

  create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  }

  delete(id: string): Promise<Category> {
    return prisma.category.delete({ where: { id } });
  }
}

export const categoryRepository = new CategoryRepository();
