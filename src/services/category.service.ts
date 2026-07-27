import { categoryRepository } from '@repositories/category.repository';
import { NotFoundError, ConflictError } from '@utils/errors';
import { slugify } from '@utils/slugify';
import { getOrSetCache, invalidateCache, CacheKey } from '@lib/cache';

const CATEGORY_CACHE_TTL_SECONDS = 3600;

interface CategoryInput {
  name: string;
  description?: string;
  iconKey?: string;
  parentId?: string;
  sortOrder?: number;
}

class CategoryService {
  list(includeInactive: boolean) {
    return getOrSetCache(CacheKey.categories(includeInactive), CATEGORY_CACHE_TTL_SECONDS, () =>
      categoryRepository.findAll(includeInactive),
    );
  }

  async getById(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category');
    return category;
  }

  async create(input: CategoryInput) {
    const slug = slugify(input.name);
    const existing = await categoryRepository.findBySlug(slug);
    if (existing) throw new ConflictError('A category with this name already exists');

    const category = await categoryRepository.create({
      name: input.name,
      slug,
      description: input.description,
      iconKey: input.iconKey,
      sortOrder: input.sortOrder ?? 0,
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
    });
    await invalidateCache('cache:categories:*');
    return category;
  }

  async update(
    id: string,
    input: Partial<Omit<CategoryInput, 'parentId'>> & { isActive?: boolean; parentId?: string | null },
  ) {
    await this.getById(id);
    const updated = await categoryRepository.update(id, {
      ...(input.name ? { name: input.name, slug: slugify(input.name) } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.iconKey !== undefined ? { iconKey: input.iconKey } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.parentId !== undefined ? { parent: input.parentId ? { connect: { id: input.parentId } } : { disconnect: true } } : {}),
    });
    await invalidateCache('cache:categories:*');
    return updated;
  }

  async remove(id: string) {
    await this.getById(id);
    await categoryRepository.delete(id);
    await invalidateCache('cache:categories:*');
  }
}

export const categoryService = new CategoryService();
