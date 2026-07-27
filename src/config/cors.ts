import { CorsOptions } from 'cors';
import { env, isDevelopment } from '@config/env';

const allowedOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (mobile app, curl, server-to-server) with no Origin header.
    if (!origin || isDevelopment || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86400,
};
