import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { categoryService } from '@services/category.service';

export const categoryController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const categories = await categoryService.list(Boolean(req.query.includeInactive));
    ApiResponse.success(res, { message: 'Categories retrieved', data: categories });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.getById(req.params.id);
    ApiResponse.success(res, { message: 'Category retrieved', data: category });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.create(req.body);
    ApiResponse.created(res, 'Category created', category);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.update(req.params.id, req.body);
    ApiResponse.success(res, { message: 'Category updated', data: category });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await categoryService.remove(req.params.id);
    ApiResponse.success(res, { message: 'Category deleted successfully', data: null });
  }),
};
