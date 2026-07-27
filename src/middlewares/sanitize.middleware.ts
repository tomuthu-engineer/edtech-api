import { NextFunction, Request, Response } from 'express';
import { filterXSS } from 'xss';

const xssOptions = { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style'] };

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return filterXSS(value, xssOptions);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, sanitizeValue(val)]),
    );
  }
  return value;
}

/**
 * Strips executable markup from string fields in body/params/query.
 * Defense-in-depth against stored/reflected XSS on top of output encoding
 * done by the client apps.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params) as typeof req.params;
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query) as typeof req.query;
  }
  next();
}
