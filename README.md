# EdTech LMS — Backend

Production-grade REST API powering a Learning Management System: a React Native
student app, a Next.js admin portal, and everything in between (courses, live
classes, community, notifications, analytics).

## Tech stack

| Concern        | Choice                                   |
|-----------------|-------------------------------------------|
| Runtime         | Node.js 20 LTS, TypeScript (strict)       |
| Framework       | Express.js                                |
| Database        | PostgreSQL + Prisma ORM                   |
| Auth            | JWT access/refresh tokens, bcrypt         |
| Validation      | Zod (body/params/query)                   |
| Caching         | Redis (cache-aside)                       |
| Queues          | BullMQ (email, notifications, reports, cleanup) |
| Realtime        | Socket.IO (Redis adapter)                 |
| Object storage  | AWS S3 (SDK v3) + CloudFront-ready        |
| Live classes    | Provider-agnostic adapter (LiveKit / Agora) |
| Docs            | Swagger / OpenAPI 3                       |
| Logging         | Pino                                      |
| Testing         | Jest + Supertest                          |
| Containers      | Docker, docker-compose (dev & prod)       |

## Architecture

Clean, layered architecture — business logic never lives in controllers:

```
Route → Controller → Service → Repository → Prisma → PostgreSQL
```

- **Route** — wires middleware (auth, validation, rate limiting) to a controller.
- **Controller** — validates nothing itself (that's `validateRequest`), calls a service, shapes the response.
- **Service** — business logic, authorization decisions, orchestration across repositories/other services.
- **Repository** — the only layer that talks to Prisma.

Every response follows one envelope:

```jsonc
// success
{ "success": true, "message": "...", "data": {}, "meta": {} }
// error
{ "success": false, "message": "...", "errors": [{ "field": "email", "message": "..." }] }
```

## Getting started

### Option A — Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

This starts Postgres, Redis, the API (`:4000`), and a background worker with
hot reload. Then run migrations + seed data:

```bash
docker compose exec app npx prisma migrate dev
docker compose exec app npm run prisma:seed
```

API docs: http://localhost:4000/docs

### Option B — Local Node

Requires local PostgreSQL and Redis.

```bash
cp .env.example .env   # point DATABASE_URL / REDIS_URL at your local services
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev             # API on :4000
npm run worker          # in a second terminal — background job processor
```

### Seeded accounts

All seeded users share the password `Passw0rd!`:

| Role       | Email                        |
|------------|-------------------------------|
| Super Admin| admin@edtech-lms.com          |
| Instructor | instructor1@edtech-lms.com … 3|
| Student    | student1@edtech-lms.com … 5   |

## Scripts

| Command                  | Description                                  |
|---------------------------|-----------------------------------------------|
| `npm run dev`             | API with hot reload (tsx watch)               |
| `npm run worker`          | Background job worker (BullMQ)                |
| `npm run build`           | Compile TypeScript to `dist/`                 |
| `npm start`               | Run the compiled build                        |
| `npm run typecheck`       | `tsc --noEmit`                                |
| `npm run lint` / `lint:fix`| ESLint                                        |
| `npm test` / `test:watch` / `test:coverage` | Jest                        |
| `npm run prisma:migrate`  | Create/apply a dev migration                  |
| `npm run prisma:seed`     | Seed demo data                                |
| `npm run prisma:studio`   | Prisma Studio (DB GUI)                        |

## Project layout

```
src/
  config/        env, logger, database, redis, cors, swagger
  constants/     roles, permissions
  controllers/   validate → call service → respond
  routes/v1/     one router per domain, mounted under /api/v1
  middlewares/   auth, rbac, validation, rate limiting, error handling
  services/      business logic (never touches Prisma directly)
  repositories/  the only layer that touches Prisma
  validators/    Zod schemas per route
  dto/           service-layer input/output contracts
  socket/        Socket.IO server, room helpers, event handlers
  queues/        BullMQ queue definitions + producers
  jobs/          BullMQ worker processors
  storage/       S3 StorageService (the only code that touches the AWS SDK)
  lib/           mailer, cache helper, live-class provider adapters
  emails/        HTML email templates
  utils/         errors, JWT, hashing, pagination, response envelope
prisma/
  schema.prisma  full data model
  seed.ts        demo data generator
tests/
  unit/          pure functions + services (mocked repositories)
  integration/   supertest against the Express app
```

## Security

- Helmet, CORS allow-list, HPP, input sanitization (XSS stripping) on every request.
- Separate, tighter rate limits for auth/OTP endpoints.
- Passwords hashed with bcrypt; refresh tokens stored hashed (SHA-256) and rotated on every refresh.
- Every file upload is validated (MIME + size) against a per-entity-type policy before it reaches S3.
- S3 objects are private by default; public assets (thumbnails, avatars) are served through CloudFront when `AWS_CLOUDFRONT_URL` is set, never as raw bucket URLs.
- Centralized error handler never leaks stack traces or internal error messages in production.

## File uploads

Controllers never call the AWS SDK — everything routes through `StorageService`
(`src/storage/storage.service.ts`):

- **Small files** (avatars, thumbnails, course resources ≤100MB): direct multipart
  upload via `POST /storage/upload/:entityType`.
- **Large files** (lesson videos, live recordings): `POST /storage/signed-upload-url`
  returns a pre-signed S3 URL — the client uploads directly to S3, then calls
  back (e.g. `POST /lessons/:id/video`) to persist the resulting key.

## Live classes

`src/lib/liveProviders/` defines a `LiveProvider` interface with `LiveKit` and
`Agora` adapters. Swapping providers, or adding Zoom, is a single new class —
`LiveService` and all routes are provider-agnostic.

## Background jobs

Four BullMQ queues, run by `npm run worker` (a separate process from the API):

- **email** — every transactional email (OTP, welcome, password changed).
- **notification** — fan-out of in-app notifications + realtime push over Socket.IO.
- **report** — async analytics report generation, uploaded to S3, user notified when ready.
- **cleanup** — daily recurring jobs (expired refresh tokens/OTPs, stale temp files, archived notifications).

## Testing

```bash
npm test
```

Unit tests mock repositories/external services (no live DB required).
Integration tests exercise the Express app end-to-end for routing/validation/error-envelope
behavior, with Prisma/Redis mocked so the suite is deterministic in CI without live infrastructure.

## Environment variables

See `.env.example` for the full list. Nothing has a hardcoded fallback for
secrets — `src/config/env.ts` validates the environment at boot with Zod and
fails fast with a clear error if something required is missing.
