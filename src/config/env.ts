import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  APP_NAME: z.string().default('EdTech LMS API'),
  APP_URL: z.string().default('http://localhost:4000'),
  CLIENT_STUDENT_APP_URL: z.string().optional(),
  CLIENT_ADMIN_PORTAL_URL: z.string().optional(),
  CORS_ORIGINS: z.string().default(''),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN_REMEMBER: z.string().default('30d'),
  JWT_ISSUER: z.string().default('edtech-lms'),
  JWT_AUDIENCE: z.string().default('edtech-lms-clients'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  OTP_LENGTH: z.coerce.number().default(6),
  OTP_EXPIRES_IN_MINUTES: z.coerce.number().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().default('edtech-lms-uploads'),
  AWS_S3_SIGNED_URL_EXPIRES_IN: z.coerce.number().default(900),
  AWS_CLOUDFRONT_URL: z.string().optional().default(''),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM_NAME: z.string().default('EdTech LMS'),
  SMTP_FROM_EMAIL: z.string().default('no-reply@edtech-lms.com'),
  SMTP_SECURE: z.coerce.boolean().default(false),

  LIVE_DEFAULT_PROVIDER: z.enum(['LIVEKIT', 'AGORA', 'ZOOM', 'CUSTOM']).default('LIVEKIT'),
  LIVEKIT_API_KEY: z.string().optional().default(''),
  LIVEKIT_API_SECRET: z.string().optional().default(''),
  LIVEKIT_URL: z.string().optional().default(''),
  AGORA_APP_ID: z.string().optional().default(''),
  AGORA_APP_CERTIFICATE: z.string().optional().default(''),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables. Check .env against .env.example.');
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
