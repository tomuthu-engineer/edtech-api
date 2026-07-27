import { AnyZodObject } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

import * as auth from '@validators/auth.validator';
import * as user from '@validators/user.validator';
import * as category from '@validators/category.validator';
import * as course from '@validators/course.validator';
import * as curriculum from '@validators/curriculum.validator';
import * as progress from '@validators/progress.validator';
import * as live from '@validators/live.validator';
import * as community from '@validators/community.validator';
import * as report from '@validators/report.validator';
import * as admin from '@validators/admin.validator';
import * as storage from '@validators/storage.validator';

/**
 * Converts a Zod object schema to a plain OpenAPI 3 schema object.
 * `$refStrategy: 'none'` inlines everything into one flat schema instead of
 * emitting a `definitions` block — simplest, self-contained shape for a
 * single requestBody.
 */
function toOpenApiSchema(zodSchema: AnyZodObject | undefined): Record<string, unknown> | undefined {
  if (!zodSchema) return undefined;
  // Cast to `unknown` first: zod-to-json-schema's generic overloads can hit
  // TS's "type instantiation excessively deep" limit against some of our
  // larger validator shapes. The runtime conversion itself is fine — only
  // the static inference needs the escape hatch.
  return zodToJsonSchema(zodSchema as unknown as Parameters<typeof zodToJsonSchema>[0], {
    target: 'openApi3',
    $refStrategy: 'none',
  }) as Record<string, unknown>;
}

function bodyOf(schemas: RequestSchemas): Record<string, unknown> | undefined {
  return toOpenApiSchema(schemas.body);
}

/**
 * Named request-body schemas, generated from the exact same Zod validators
 * every route already runs at request time — the OpenAPI docs and runtime
 * validation can never drift apart. Referenced from route JSDoc via
 * `$ref: '#/components/schemas/<Name>'`.
 */
export const requestBodySchemas: Record<string, Record<string, unknown> | undefined> = {
  // Auth
  RegisterBody: bodyOf(auth.registerValidator),
  LoginBody: bodyOf(auth.loginValidator),
  RefreshTokenBody: bodyOf(auth.refreshTokenValidator),
  LogoutBody: bodyOf(auth.logoutValidator),
  ForgotPasswordBody: bodyOf(auth.forgotPasswordValidator),
  ResetPasswordBody: bodyOf(auth.resetPasswordValidator),
  VerifyEmailBody: bodyOf(auth.verifyEmailValidator),
  ResendOtpBody: bodyOf(auth.resendOtpValidator),

  // Users
  UpdateProfileBody: bodyOf(user.updateProfileValidator),
  UpdateUserStatusBody: bodyOf(user.updateUserStatusValidator),
  UpdateUserRoleBody: bodyOf(user.updateUserRolesValidator),

  // Categories
  CreateCategoryBody: bodyOf(category.createCategoryValidator),
  UpdateCategoryBody: bodyOf(category.updateCategoryValidator),

  // Courses
  CreateCourseBody: bodyOf(course.createCourseValidator),
  UpdateCourseBody: bodyOf(course.updateCourseValidator),
  ChangeCourseStatusBody: bodyOf(course.changeCourseStatusValidator),

  // Curriculum (modules / lessons / resources)
  CreateModuleBody: bodyOf(curriculum.createModuleValidator),
  UpdateModuleBody: bodyOf(curriculum.updateModuleValidator),
  ReorderModulesBody: bodyOf(curriculum.reorderModulesValidator),
  CreateLessonBody: bodyOf(curriculum.createLessonValidator),
  UpdateLessonBody: bodyOf(curriculum.updateLessonValidator),
  ReorderLessonsBody: bodyOf(curriculum.reorderLessonsValidator),
  AttachLessonVideoBody: bodyOf(curriculum.attachLessonVideoValidator),
  CreateResourceBody: bodyOf(curriculum.createResourceValidator),

  // Progress
  UpdateLessonProgressBody: bodyOf(progress.updateLessonProgressValidator),

  // Live classes
  ScheduleLiveSessionBody: bodyOf(live.scheduleLiveSessionValidator),
  EndLiveSessionBody: bodyOf(live.endLiveSessionValidator),
  JoinLiveSessionBody: bodyOf(live.joinLiveSessionValidator),

  // Community
  CreatePostBody: bodyOf(community.createPostValidator),
  CreateCommentBody: bodyOf(community.createCommentValidator),
  CreateReplyBody: bodyOf(community.createReplyValidator),
  PinPostBody: bodyOf(community.pinPostValidator),

  // Reports (moderation)
  CreateReportBody: bodyOf(report.createReportValidator),
  ResolveReportBody: bodyOf(report.resolveReportValidator),

  // Admin
  UpsertSettingBody: bodyOf(admin.upsertSettingValidator),
  GenerateReportBody: bodyOf(admin.generateReportValidator),

  // Storage
  SignedUploadUrlBody: bodyOf(storage.signedUploadUrlValidator),
};
