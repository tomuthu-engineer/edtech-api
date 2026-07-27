import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ErrorDetail } from '@utils/errors';
import { ApiResponse } from '@utils/ApiResponse';

export interface RequestSchemas {
  body?: AnyZodObject;
  params?: AnyZodObject;
  query?: AnyZodObject;
  headers?: AnyZodObject;
}

function zodErrorToDetails(error: ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Validates and replaces req.body/params/query/headers with the parsed,
 * type-coerced Zod output. Never trust client input: this runs before
 * every controller that touches the client.
 */
export const validateRequest =
  (schemas: RequestSchemas) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      if (schemas.headers) {
        schemas.headers.parse(req.headers);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        ApiResponse.error(res, {
          message: 'Validation failed',
          errors: zodErrorToDetails(error),
          statusCode: 400,
        });
        return;
      }
      next(error);
    }
  };
