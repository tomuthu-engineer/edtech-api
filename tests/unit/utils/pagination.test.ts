import { toSkipTake, buildCursorMeta, DEFAULT_LIMIT, MAX_LIMIT } from '@utils/pagination';

describe('pagination utils', () => {
  describe('toSkipTake', () => {
    it('applies defaults when no query is given', () => {
      const result = toSkipTake({});
      expect(result).toEqual({ page: 1, limit: DEFAULT_LIMIT, skip: 0, take: DEFAULT_LIMIT });
    });

    it('computes skip from page and limit', () => {
      const result = toSkipTake({ page: 3, limit: 10 });
      expect(result).toEqual({ page: 3, limit: 10, skip: 20, take: 10 });
    });

    it('clamps limit to MAX_LIMIT', () => {
      const result = toSkipTake({ limit: 9999 });
      expect(result.limit).toBe(MAX_LIMIT);
    });

    it('floors page at 1 even for invalid input', () => {
      const result = toSkipTake({ page: -5 });
      expect(result.page).toBe(1);
      expect(result.skip).toBe(0);
    });
  });

  describe('buildCursorMeta', () => {
    it('reports no next page when items fit within the limit', () => {
      const items = [{ id: '1' }, { id: '2' }];
      const meta = buildCursorMeta(items, 5);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.nextCursor).toBeNull();
      expect(meta.items).toHaveLength(2);
    });

    it('trims the extra lookahead item and reports a next cursor', () => {
      const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const meta = buildCursorMeta(items, 2);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.items).toHaveLength(2);
      expect(meta.nextCursor).toBe('2');
    });
  });
});
