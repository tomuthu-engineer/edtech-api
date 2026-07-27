import { categoryRepository } from '@repositories/category.repository';
import { categoryService } from '@services/category.service';
import { ConflictError, NotFoundError } from '@utils/errors';

jest.mock('@repositories/category.repository');
jest.mock('@lib/cache', () => ({
  getOrSetCache: jest.fn((_key: string, _ttl: number, fetcher: () => unknown) => fetcher()),
  invalidateCache: jest.fn().mockResolvedValue(undefined),
}));

const mockedRepo = categoryRepository as jest.Mocked<typeof categoryRepository>;

describe('CategoryService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a category with a slugified name when no collision exists', async () => {
      mockedRepo.findBySlug.mockResolvedValue(null);
      mockedRepo.create.mockResolvedValue({ id: 'cat-1', name: 'Web Development', slug: 'web-development' } as never);

      const result = await categoryService.create({ name: 'Web Development' });

      expect(mockedRepo.findBySlug).toHaveBeenCalledWith('web-development');
      expect(mockedRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Web Development', slug: 'web-development' }),
      );
      expect(result.slug).toBe('web-development');
    });

    it('throws ConflictError when a category with the same slug already exists', async () => {
      mockedRepo.findBySlug.mockResolvedValue({ id: 'existing', slug: 'web-development' } as never);

      await expect(categoryService.create({ name: 'Web Development' })).rejects.toBeInstanceOf(ConflictError);
      expect(mockedRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('throws NotFoundError when the category does not exist', async () => {
      mockedRepo.findById.mockResolvedValue(null);
      await expect(categoryService.getById('missing-id')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns the category when found', async () => {
      mockedRepo.findById.mockResolvedValue({ id: 'cat-1', name: 'Design' } as never);
      const result = await categoryService.getById('cat-1');
      expect(result).toEqual({ id: 'cat-1', name: 'Design' });
    });
  });

  describe('remove', () => {
    it('deletes an existing category', async () => {
      mockedRepo.findById.mockResolvedValue({ id: 'cat-1' } as never);
      mockedRepo.delete.mockResolvedValue({ id: 'cat-1' } as never);

      await categoryService.remove('cat-1');

      expect(mockedRepo.delete).toHaveBeenCalledWith('cat-1');
    });
  });
});
