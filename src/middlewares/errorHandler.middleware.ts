import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { MulterError } from 'multer';
import { AppError, ErrorDetail } from '@utils/errors';
import { ApiResponse } from '@utils/ApiResponse';
import { logger } from '@config/logger';
import { isProduction } from '@config/env';

interface NormalizedError {
  statusCode: number;
  message: string;
  errors: ErrorDetail[];
}

function normalizePrismaError(err: Prisma.PrismaClientKnownRequestError): NormalizedError {
  switch (err.code) {
    case 'P2002': {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      return { statusCode: 409, message: `A record with this ${target} already exists`, errors: [] };
    }
    case 'P2025':
      return { statusCode: 404, message: 'Record not found', errors: [] };
    case 'P2003':
      return { statusCode: 409, message: 'This action violates a related record constraint', errors: [] };
    default:
      return { statusCode: 400, message: 'Database request error', errors: [] };
  }
}

function normalizeError(err: unknown): NormalizedError {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, message: err.message, errors: err.errors };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: 400,
      message: 'Validation failed',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return normalizePrismaError(err);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return { statusCode: 400, message: 'Invalid database query', errors: [] };
  }

  if (err instanceof TokenExpiredError) {
    return { statusCode: 401, message: 'Token has expired', errors: [] };
  }

  if (err instanceof JsonWebTokenError) {
    return { statusCode: 401, message: 'Invalid token', errors: [] };
  }

  if (err instanceof MulterError) {
    return { statusCode: 400, message: err.message, errors: [] };
  }

  return { statusCode: 500, message: 'Internal server error', errors: [] };
}

/** Centralized error handler — the single place HTTP status/shape is decided. */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const normalized = normalizeError(err);
  const isServerError = normalized.statusCode >= 500;

  const logPayload = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.id,
    statusCode: normalized.statusCode,
    err,
  };

  if (isServerError) {
    logger.error(logPayload, 'Unhandled request error');
  } else {
    logger.warn(logPayload, 'Handled request error');
  }

  ApiResponse.error(res, {
    message: isServerError && isProduction ? 'Something went wrong' : normalized.message,
    errors: normalized.errors,
    statusCode: normalized.statusCode,
  });
}
