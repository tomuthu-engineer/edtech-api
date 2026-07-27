import express, { Application } from 'express';
import { randomUUID } from 'crypto';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { env } from '@config/env';
import { logger } from '@config/logger';
import { corsOptions } from '@config/cors';
import { swaggerSpec } from '@config/swagger';

import { requestContext } from '@middlewares/requestContext.middleware';
import { sanitizeInput } from '@middlewares/sanitize.middleware';
import { globalRateLimiter } from '@middlewares/rateLimiter.middleware';
import { errorHandler } from '@middlewares/errorHandler.middleware';
import { notFoundHandler } from '@middlewares/notFoundHandler.middleware';

import { healthRouter } from '@routes/health.routes';
import { v1Router } from '@routes/v1';

export function createApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // ---- Security -----------------------------------------------------------
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors(corsOptions));
  app.use(hpp());

  // ---- Request plumbing -----------------------------------------------------
  app.use(requestContext);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.requestId ?? randomUUID(),
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
    }),
  );

  // ---- Parsers ---------------------------------------------------------------
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(compression());
  app.use(sanitizeInput);

  // ---- Rate limiting -----------------------------------------------------
  app.use(env.API_PREFIX, globalRateLimiter);

  // ---- Health & Docs -----------------------------------------------------
  app.use('/', healthRouter);
  app.use(
    '/docs',
    // The global helmet() CSP above blocks the inline <script> Swagger UI's
    // HTML shell uses to bootstrap itself — without this override the page
    // renders but is non-interactive (Authorize modal, "Try it out", etc.
    // silently don't work). Scoped to /docs only; the rest of the API keeps
    // the strict default CSP.
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: env.APP_NAME,
      swaggerOptions: { persistAuthorization: true },
    }),
  );
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec));

  // ---- API -----------------------------------------------------------------
  app.use(env.API_PREFIX, v1Router);

  // ---- Fallbacks -------------------------------------------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
