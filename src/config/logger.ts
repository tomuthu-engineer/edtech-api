import pino from 'pino';
import { env, isDevelopment } from '@config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: env.APP_NAME },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  },
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export const createChildLogger = (context: string) => logger.child({ context });
