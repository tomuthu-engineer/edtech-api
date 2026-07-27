import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

/** Stamps every request with a correlation id, echoed back for client-side tracing. */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  req.requestId = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
