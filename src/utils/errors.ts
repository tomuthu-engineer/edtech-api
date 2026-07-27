export interface ErrorDetail {
  field?: string;
  message: string;
}

/**
 * Base class for all operational errors the app throws intentionally.
 * Caught by the centralized error handler and mapped 1:1 to an HTTP response.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: ErrorDetail[];
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    errors: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors: ErrorDetail[] = []) {
    super(message, 400, 'VALIDATION_ERROR', errors);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Something went wrong') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}
