import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { env, isProduction } from '@config/env';
import { requestBodySchemas } from '@config/openapiSchemas';

// swagger-jsdoc globs source files for @openapi JSDoc comments. In dev we run
// TS directly via tsx (src/**/*.ts); in production we run the compiled
// dist/**/*.js. Build the glob from this file's own location so it resolves
// correctly either way, regardless of process.cwd(). Backslash is the glob
// escape character, so on Windows path.join's `\` separators must be
// normalized to `/` or the pattern silently matches nothing.
const toGlob = (...segments: string[]) => path.join(...segments).split(path.sep).join('/');
const routeFilesGlob = toGlob(__dirname, '..', 'routes', '**', `*.${isProduction ? 'js' : 'ts'}`);
const dtoFilesGlob = toGlob(__dirname, '..', 'dto', '**', `*.${isProduction ? 'js' : 'ts'}`);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: env.APP_NAME,
      version: '1.0.0',
      description:
        'REST API powering the EdTech LMS platform: student mobile app and admin portal. ' +
        'All responses follow a single envelope: `{ success, message, data, meta }` on success, ' +
        '`{ success, message, errors }` on failure.',
      contact: { name: 'EdTech LMS Engineering' },
    },
    servers: [{ url: `${env.APP_URL}${env.API_PREFIX}`, description: env.NODE_ENV }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      // Reusable path parameters. swagger-jsdoc does NOT infer OpenAPI
      // `parameters` from Express's `:id`-style route syntax — without an
      // explicit `parameters:` entry (referencing one of these via $ref),
      // Swagger UI renders no input field at all for that segment, so
      // "Try it out" silently sends the literal string "{id}" as the URL.
      parameters: {
        IdParam: { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        CourseIdParam: { name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ModuleIdParam: { name: 'moduleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        LessonIdParam: { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ResourceIdParam: { name: 'resourceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        PostIdParam: { name: 'postId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        CommentIdParam: { name: 'commentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ReplyIdParam: { name: 'replyId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        SlugParam: { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
        SettingKeyParam: { name: 'key', in: 'path', required: true, schema: { type: 'string' } },
        EntityTypeParam: { name: 'entityType', in: 'path', required: true, schema: { type: 'string' } },
      },
      schemas: {
        ...requestBodySchemas,
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success' },
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Registration, login, tokens, password/OTP flows' },
      { name: 'Users', description: 'Student & admin user management' },
      { name: 'Categories', description: 'Course category taxonomy' },
      { name: 'Courses', description: 'Course catalog CRUD and lifecycle' },
      { name: 'Modules & Lessons', description: 'Course curriculum structure' },
      { name: 'Enrollments', description: 'Course enrollment management' },
      { name: 'Progress', description: 'Lesson/course progress tracking' },
      { name: 'Live Classes', description: 'Scheduling and joining live sessions' },
      { name: 'Community', description: 'Posts, comments, replies, likes, moderation' },
      { name: 'Notifications', description: 'In-app notification center' },
      { name: 'Search', description: 'Cross-entity search' },
      { name: 'Admin', description: 'Dashboard metrics, analytics, audit logs, settings' },
      { name: 'Storage', description: 'File upload / signed URL issuance' },
    ],
  },
  apis: [routeFilesGlob, dtoFilesGlob],
};

export const swaggerSpec = swaggerJsdoc(options);
