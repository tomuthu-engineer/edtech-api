import { Router } from 'express';
import { prisma } from '@config/database';
import { redisClient } from '@config/redis';

export const healthRouter = Router();

/**
 * Liveness/readiness probe for orchestrators (Docker, k8s, ALB).
 * Checks downstream dependencies so a broken DB/Redis connection surfaces
 * as an unhealthy pod instead of a slow-failing API.
 */
healthRouter.get('/health', async (_req, res) => {
  const checks: Record<string, 'ok' | 'error'> = { database: 'ok', redis: 'ok' };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    checks.database = 'error';
  }

  try {
    await redisClient.ping();
  } catch {
    checks.redis = 'error';
  }

  const isHealthy = Object.values(checks).every((status) => status === 'ok');

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'Service is healthy' : 'Service is degraded',
    data: { status: isHealthy ? 'healthy' : 'degraded', checks, uptime: process.uptime() },
  });
});
