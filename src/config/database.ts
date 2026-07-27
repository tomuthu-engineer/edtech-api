import { PrismaClient, Prisma } from '@prisma/client';
import { env, isDevelopment } from '@config/env';
import { createChildLogger } from '@config/logger';

const dbLogger = createChildLogger('prisma');

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const logOptions: Prisma.LogLevel[] = isDevelopment
  ? ['warn', 'error']
  : ['error'];

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: logOptions.map((level) => ({ emit: 'event', level })) as Prisma.LogDefinition[],
    datasources: { db: { url: env.DATABASE_URL } },
  });

  client.$on('warn' as never, (e: Prisma.LogEvent) => dbLogger.warn(e, 'Prisma warning'));
  client.$on('error' as never, (e: Prisma.LogEvent) => dbLogger.error(e, 'Prisma error'));

  return client;
}

// Reuse a single PrismaClient across hot reloads in development to avoid
// exhausting the connection pool.
export const prisma = global.__prisma ?? createPrismaClient();

if (isDevelopment) {
  global.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  dbLogger.info('Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  dbLogger.info('Database disconnected');
}
