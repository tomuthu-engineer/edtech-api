-- CreateEnum
CREATE TYPE "role_name" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'MODERATOR', 'STUDENT', 'FUTURE_READY');

-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "auth_provider" AS ENUM ('LOCAL', 'GOOGLE', 'APPLE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "otp_purpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_MFA', 'PHONE_VERIFICATION');

-- CreateEnum
CREATE TYPE "course_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "course_difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS');

-- CreateEnum
CREATE TYPE "lesson_content_type" AS ENUM ('VIDEO', 'PDF', 'ARTICLE', 'QUIZ', 'EXTERNAL_LINK', 'LIVE');

-- CreateEnum
CREATE TYPE "enrollment_status" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "lesson_progress_status" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "live_session_provider" AS ENUM ('LIVEKIT', 'AGORA', 'ZOOM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "live_session_status" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "attendee_role" AS ENUM ('HOST', 'CO_HOST', 'ATTENDEE');

-- CreateEnum
CREATE TYPE "post_media_type" AS ENUM ('NONE', 'IMAGE', 'VIDEO', 'MIXED');

-- CreateEnum
CREATE TYPE "report_target_type" AS ENUM ('POST', 'COMMENT', 'REPLY', 'USER');

-- CreateEnum
CREATE TYPE "report_status" AS ENUM ('PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('SYSTEM', 'COURSE', 'LIVE_CLASS', 'COMMUNITY', 'ANNOUNCEMENT', 'ENROLLMENT', 'PROGRESS');

-- CreateEnum
CREATE TYPE "file_entity_type" AS ENUM ('USER_PROFILE', 'COURSE_THUMBNAIL', 'COURSE_BANNER', 'LESSON_VIDEO', 'LESSON_THUMBNAIL', 'LESSON_RESOURCE', 'LIVE_RECORDING', 'COMMUNITY_IMAGE', 'COMMUNITY_VIDEO', 'CERTIFICATE', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'ARCHIVE', 'LOGIN', 'LOGOUT', 'ROLE_CHANGE', 'MODERATE', 'OTHER');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" "role_name" NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT,
    "auth_provider" "auth_provider" NOT NULL DEFAULT 'LOCAL',
    "avatar_key" TEXT,
    "bio" TEXT,
    "status" "account_status" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_id" TEXT,
    "device_name" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "remember_me" BOOLEAN NOT NULL DEFAULT false,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "purpose" "otp_purpose" NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon_key" TEXT,
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT NOT NULL,
    "category_id" TEXT,
    "instructor_id" TEXT NOT NULL,
    "thumbnail_key" TEXT,
    "banner_key" TEXT,
    "difficulty" "course_difficulty" NOT NULL DEFAULT 'ALL_LEVELS',
    "status" "course_status" NOT NULL DEFAULT 'DRAFT',
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "learning_outcomes" TEXT[],
    "requirements" TEXT[],
    "language" TEXT NOT NULL DEFAULT 'en',
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "enrollment_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content_type" "lesson_content_type" NOT NULL DEFAULT 'VIDEO',
    "video_key" TEXT,
    "video_duration_sec" INTEGER,
    "article_content" TEXT,
    "external_url" TEXT,
    "thumbnail_key" TEXT,
    "is_preview" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_resources" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_key" TEXT,
    "external_url" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "status" "enrollment_status" NOT NULL DEFAULT 'ACTIVE',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "price_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "current_lesson_id" TEXT,
    "completed_lessons" INTEGER NOT NULL DEFAULT 0,
    "total_lessons" INTEGER NOT NULL DEFAULT 0,
    "completion_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_watch_time_sec" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "certificate_key" TEXT,
    "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "status" "lesson_progress_status" NOT NULL DEFAULT 'NOT_STARTED',
    "watch_time_sec" INTEGER NOT NULL DEFAULT 0,
    "last_position_sec" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" TEXT NOT NULL,
    "course_id" TEXT,
    "host_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "provider" "live_session_provider" NOT NULL DEFAULT 'LIVEKIT',
    "meeting_id" TEXT,
    "join_url" TEXT,
    "host_url" TEXT,
    "recording_key" TEXT,
    "status" "live_session_status" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_start" TIMESTAMP(3) NOT NULL,
    "scheduled_end" TIMESTAMP(3) NOT NULL,
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "max_attendees" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_attendees" (
    "id" TEXT NOT NULL,
    "live_session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "attendee_role" NOT NULL DEFAULT 'ATTENDEE',
    "joined_at" TIMESTAMP(3),
    "left_at" TIMESTAMP(3),
    "duration_sec" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "media_type" "post_media_type" NOT NULL DEFAULT 'NONE',
    "media_keys" TEXT[],
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "pinned_by_id" TEXT,
    "pinned_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_replies" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT,
    "comment_id" TEXT,
    "reply_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "target_type" "report_target_type" NOT NULL,
    "post_id" TEXT,
    "comment_id" TEXT,
    "reply_id" TEXT,
    "reported_user_id" TEXT,
    "reason" TEXT NOT NULL,
    "status" "report_status" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "action_url" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" "audit_action" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_assets" (
    "id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT,
    "entity_type" "file_entity_type" NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "extension" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "otp_codes_user_id_purpose_idx" ON "otp_codes"("user_id", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE INDEX "courses_category_id_idx" ON "courses"("category_id");

-- CreateIndex
CREATE INDEX "courses_instructor_id_idx" ON "courses"("instructor_id");

-- CreateIndex
CREATE INDEX "courses_slug_idx" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "modules_course_id_idx" ON "modules"("course_id");

-- CreateIndex
CREATE INDEX "lessons_module_id_idx" ON "lessons"("module_id");

-- CreateIndex
CREATE INDEX "lesson_resources_lesson_id_idx" ON "lesson_resources"("lesson_id");

-- CreateIndex
CREATE INDEX "enrollments_user_id_idx" ON "enrollments"("user_id");

-- CreateIndex
CREATE INDEX "enrollments_course_id_idx" ON "enrollments"("course_id");

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_user_id_course_id_key" ON "enrollments"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "course_progress_user_id_idx" ON "course_progress"("user_id");

-- CreateIndex
CREATE INDEX "course_progress_course_id_idx" ON "course_progress"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_progress_user_id_course_id_key" ON "course_progress"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "lesson_progress_user_id_idx" ON "lesson_progress"("user_id");

-- CreateIndex
CREATE INDEX "lesson_progress_lesson_id_idx" ON "lesson_progress"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_user_id_lesson_id_key" ON "lesson_progress"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "live_sessions_course_id_idx" ON "live_sessions"("course_id");

-- CreateIndex
CREATE INDEX "live_sessions_host_id_idx" ON "live_sessions"("host_id");

-- CreateIndex
CREATE INDEX "live_sessions_status_idx" ON "live_sessions"("status");

-- CreateIndex
CREATE INDEX "live_sessions_scheduled_start_idx" ON "live_sessions"("scheduled_start");

-- CreateIndex
CREATE INDEX "live_attendees_live_session_id_idx" ON "live_attendees"("live_session_id");

-- CreateIndex
CREATE INDEX "live_attendees_user_id_idx" ON "live_attendees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_attendees_live_session_id_user_id_key" ON "live_attendees"("live_session_id", "user_id");

-- CreateIndex
CREATE INDEX "community_posts_author_id_idx" ON "community_posts"("author_id");

-- CreateIndex
CREATE INDEX "community_posts_is_pinned_idx" ON "community_posts"("is_pinned");

-- CreateIndex
CREATE INDEX "community_posts_created_at_idx" ON "community_posts"("created_at");

-- CreateIndex
CREATE INDEX "community_comments_post_id_idx" ON "community_comments"("post_id");

-- CreateIndex
CREATE INDEX "community_comments_author_id_idx" ON "community_comments"("author_id");

-- CreateIndex
CREATE INDEX "community_replies_comment_id_idx" ON "community_replies"("comment_id");

-- CreateIndex
CREATE INDEX "community_replies_author_id_idx" ON "community_replies"("author_id");

-- CreateIndex
CREATE INDEX "community_likes_post_id_idx" ON "community_likes"("post_id");

-- CreateIndex
CREATE INDEX "community_likes_comment_id_idx" ON "community_likes"("comment_id");

-- CreateIndex
CREATE INDEX "community_likes_reply_id_idx" ON "community_likes"("reply_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_likes_user_id_post_id_key" ON "community_likes"("user_id", "post_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_likes_user_id_comment_id_key" ON "community_likes"("user_id", "comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_likes_user_id_reply_id_key" ON "community_likes"("user_id", "reply_id");

-- CreateIndex
CREATE INDEX "bookmarks_user_id_idx" ON "bookmarks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_post_id_key" ON "bookmarks"("user_id", "post_id");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_target_type_idx" ON "reports"("target_type");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "user_notifications_user_id_is_read_idx" ON "user_notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "user_notifications_user_id_is_archived_idx" ON "user_notifications"("user_id", "is_archived");

-- CreateIndex
CREATE UNIQUE INDEX "user_notifications_user_id_notification_id_key" ON "user_notifications"("user_id", "notification_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "settings_category_idx" ON "settings"("category");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "file_assets_key_key" ON "file_assets"("key");

-- CreateIndex
CREATE INDEX "file_assets_uploaded_by_idx" ON "file_assets"("uploaded_by");

-- CreateIndex
CREATE INDEX "file_assets_entity_type_idx" ON "file_assets"("entity_type");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_attendees" ADD CONSTRAINT "live_attendees_live_session_id_fkey" FOREIGN KEY ("live_session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_attendees" ADD CONSTRAINT "live_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_pinned_by_id_fkey" FOREIGN KEY ("pinned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "community_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "community_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
