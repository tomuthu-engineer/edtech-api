import { Response } from 'express';
import { ErrorDetail } from '@utils/errors';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiMeta extends Record<string, unknown> {
  pagination?: PaginationMeta;
}

interface SuccessBody<T> {
  success: true;
  message: string;
  data: T;
  meta?: ApiMeta;
}

interface ErrorBody {
  success: false;
  message: string;
  errors: ErrorDetail[];
}

/**
 * Every controller response goes through here so the wire format stays a
 * single, predictable envelope for both client apps.
 */
export class ApiResponse {
  static success<T>(
    res: Response,
    { message = 'Success', data, meta, statusCode = 200 }: {
      message?: string;
      data: T;
      meta?: ApiMeta;
      statusCode?: number;
    },
  ): Response<SuccessBody<T>> {
    const body: SuccessBody<T> = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static created<T>(res: Response, message: string, data: T, meta?: ApiMeta): Response {
    return ApiResponse.success(res, { message, data, meta, statusCode: 201 });
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static error(
    res: Response,
    { message = 'Something went wrong', errors = [], statusCode = 500 }: {
      message?: string;
      errors?: ErrorDetail[];
      statusCode?: number;
    },
  ): Response<ErrorBody> {
    const body: ErrorBody = { success: false, message, errors };
    return res.status(statusCode).json(body);
  }

  static buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}
