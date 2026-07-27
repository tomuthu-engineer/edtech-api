import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { searchService } from '@services/search.service';

export const searchController = {
  courses: asyncHandler(async (req: Request, res: Response) => {
    const { q, page, limit } = req.query as unknown as { q: string; page?: number; limit?: number };
    const { items, total, page: p, limit: l } = await searchService.searchCourses(q, { page, limit });
    ApiResponse.success(res, {
      message: 'Course search results',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(p, l, total) },
    });
  }),

  students: asyncHandler(async (req: Request, res: Response) => {
    const { q, page, limit } = req.query as unknown as { q: string; page?: number; limit?: number };
    const { items, total, page: p, limit: l } = await searchService.searchStudents(q, { page, limit });
    ApiResponse.success(res, {
      message: 'Student search results',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(p, l, total) },
    });
  }),

  community: asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query as unknown as { q: string; limit?: number };
    const results = await searchService.searchCommunity(q, limit ?? 20);
    ApiResponse.success(res, { message: 'Community search results', data: results });
  }),

  live: asyncHandler(async (req: Request, res: Response) => {
    const { q, page, limit } = req.query as unknown as { q: string; page?: number; limit?: number };
    const { items, total, page: p, limit: l } = await searchService.searchLiveClasses(q, { page, limit });
    ApiResponse.success(res, {
      message: 'Live class search results',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(p, l, total) },
    });
  }),
};
