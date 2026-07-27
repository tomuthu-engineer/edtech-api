import request from 'supertest';
import { env } from '@config/env';
import { createApp } from '../../src/app';

// These are integration tests for HTTP wiring (routing, middleware, error
// envelopes) — not for real infrastructure. Prisma/Redis are mocked (calls
// hoisted above the imports by Jest) so the suite runs deterministically
// without a live Postgres/Redis instance.
jest.mock('@config/database', () => ({
  prisma: { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) },
}));
jest.mock('@config/redis', () => ({
  redisClient: { ping: jest.fn().mockResolvedValue('PONG') },
  createRedisConnection: jest.fn(),
}));

const app = createApp();

describe('App wiring', () => {
  it('GET /health returns a health envelope', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ status: expect.any(String), checks: expect.any(Object) }),
      }),
    );
  });

  it('returns the standard error envelope for unknown routes', async () => {
    const res = await request(app).get('/api/v1/this-route-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({ success: false, message: expect.stringContaining('not found') }),
    );
  });

  it('rejects an invalid registration payload before touching the database', async () => {
    const res = await request(app)
      .post(`${env.API_PREFIX}/auth/register`)
      .send({ firstName: '', lastName: 'Doe', email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('sets security headers via helmet', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('echoes a request id header for tracing', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toEqual(expect.any(String));
  });
});
