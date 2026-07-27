export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PrismaSkipTake {
  skip: number;
  take: number;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/** Converts a 1-indexed page/limit pair into Prisma's skip/take shape. */
export function toSkipTake(query: PaginationQuery): PrismaSkipTake & { page: number; limit: number } {
  const page = Math.max(query.page ?? DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export interface CursorPaginationQuery {
  cursor?: string;
  limit?: number;
}

/**
 * Cursor-based pagination helper (id-based). Reserved for high-traffic
 * feeds (community, notifications) where deep offset pagination is costly.
 */
export function toCursorArgs(query: CursorPaginationQuery) {
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  return {
    take: limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  };
}

export function buildCursorMeta<T extends { id: string }>(items: T[], limit: number) {
  const hasNextPage = items.length > limit;
  const trimmed = hasNextPage ? items.slice(0, limit) : items;
  const nextCursor = hasNextPage ? trimmed[trimmed.length - 1]?.id ?? null : null;
  return { items: trimmed, hasNextPage, nextCursor };
}
