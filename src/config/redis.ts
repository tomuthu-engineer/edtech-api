import Redis, { RedisOptions } from 'ioredis';
import { env } from '@config/env';
import { createChildLogger } from '@config/logger';

const redisLogger = createChildLogger('redis');

const baseOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy: (times: number) => Math.min(times * 200, 3000),
};

// General-purpose client: caching, pub/sub, session-adjacent lookups.
export const redisClient = new Redis(env.REDIS_URL, baseOptions);
redisClient.on('connect', () => redisLogger.info('Redis connected'));
redisClient.on('error', (err) => redisLogger.error(err, 'Redis connection error'));

// BullMQ (and the Socket.IO adapter) need their own dedicated connections —
// each one MUST get its own 'error' listener too, since an ioredis instance
// with zero listeners throws (crashing the process) on connection failure
// instead of just logging and retrying.
export const createRedisConnection = (): Redis => {
  const connection = new Redis(env.REDIS_URL, baseOptions);
  connection.on('error', (err) => redisLogger.error(err, 'Redis connection error'));
  return connection;
};

export async function disconnectRedis(): Promise<void> {
  await redisClient.quit();
}
