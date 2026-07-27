import { redisClient } from '@config/redis';
import { createChildLogger } from '@config/logger';

const logger = createChildLogger('cache');

/**
 * Cache-aside helper: serve from Redis when present, otherwise compute,
 * store, and return. Read failures degrade to a live DB call rather than
 * failing the request — Redis being down should never take the API down.
 */
export async function getOrSetCache<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch (err) {
    logger.warn({ err, key }, 'Cache read failed, falling back to source');
  }

  const value = await fetcher();

  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, 'Cache write failed');
  }

  return value;
}

export async function invalidateCache(keyOrPrefix: string): Promise<void> {
  try {
    if (keyOrPrefix.endsWith('*')) {
      const keys = await redisClient.keys(keyOrPrefix);
      if (keys.length > 0) await redisClient.del(...keys);
      return;
    }
    await redisClient.del(keyOrPrefix);
  } catch (err) {
    logger.warn({ err, keyOrPrefix }, 'Cache invalidation failed');
  }
}

export const CacheKey = {
  dashboardMetrics: () => 'cache:dashboard:metrics',
  categories: (includeInactive: boolean) => `cache:categories:${includeInactive}`,
  courseList: (queryHash: string) => `cache:courses:list:${queryHash}`,
  courseDetail: (id: string) => `cache:courses:detail:${id}`,
};
