import { Request, Response } from 'express';
import { ApiResponse } from '@utils/ApiResponse';

export function notFoundHandler(req: Request, res: Response): void {
  ApiResponse.error(res, {
    message: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: 404,
  });
}
