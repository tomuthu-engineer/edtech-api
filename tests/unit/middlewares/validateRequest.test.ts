import { z } from 'zod';
import { Request, Response } from 'express';
import { validateRequest } from '@middlewares/validateRequest.middleware';

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('validateRequest middleware', () => {
  const schema = { body: z.object({ email: z.string().email(), age: z.coerce.number().min(18) }) };

  it('calls next() and coerces types when the body is valid', () => {
    const req = { body: { email: 'user@example.com', age: '21' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    validateRequest(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ email: 'user@example.com', age: 21 });
  });

  it('responds 400 with field-level errors when validation fails, without calling next()', () => {
    const req = { body: { email: 'not-an-email', age: 10 } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    validateRequest(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'age' }),
      ]),
    );
  });
});
