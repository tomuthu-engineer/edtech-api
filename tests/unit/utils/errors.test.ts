import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from '@utils/errors';

describe('AppError subclasses', () => {
  it('ValidationError defaults to 400 with the VALIDATION_ERROR code', () => {
    const err = new ValidationError('Bad input', [{ field: 'email', message: 'invalid' }]);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.errors).toEqual([{ field: 'email', message: 'invalid' }]);
  });

  it('AuthenticationError defaults to 401', () => {
    expect(new AuthenticationError().statusCode).toBe(401);
  });

  it('AuthorizationError defaults to 403', () => {
    expect(new AuthorizationError().statusCode).toBe(403);
  });

  it('NotFoundError formats the resource name into the message', () => {
    const err = new NotFoundError('Course');
    expect(err.message).toBe('Course not found');
    expect(err.statusCode).toBe(404);
  });

  it('ConflictError defaults to 409', () => {
    expect(new ConflictError().statusCode).toBe(409);
  });

  it('RateLimitError defaults to 429', () => {
    expect(new RateLimitError().statusCode).toBe(429);
  });

  it('marks all AppError instances as operational', () => {
    expect(new ValidationError().isOperational).toBe(true);
  });
});
