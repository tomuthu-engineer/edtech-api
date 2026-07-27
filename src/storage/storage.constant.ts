import { FileEntityType } from '@prisma/client';

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;

export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
] as const;

export interface FileEntityRule {
  /** S3 key prefix, mirroring the required uploads/ folder structure. */
  folder: string;
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
  /** Whether files of this type are served publicly (via CDN) vs. signed URL only. */
  isPublic: boolean;
}

export const FILE_ENTITY_RULES: Record<FileEntityType, FileEntityRule> = {
  USER_PROFILE: {
    folder: 'uploads/users/profile',
    maxSizeBytes: 5 * MB,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    isPublic: true,
  },
  COURSE_THUMBNAIL: {
    folder: 'uploads/courses/thumbnails',
    maxSizeBytes: 10 * MB,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    isPublic: true,
  },
  COURSE_BANNER: {
    folder: 'uploads/courses/banners',
    maxSizeBytes: 10 * MB,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    isPublic: true,
  },
  LESSON_VIDEO: {
    folder: 'uploads/lessons/videos',
    maxSizeBytes: 5 * GB,
    allowedMimeTypes: VIDEO_MIME_TYPES,
    isPublic: false,
  },
  LESSON_THUMBNAIL: {
    folder: 'uploads/lessons/thumbnails',
    maxSizeBytes: 10 * MB,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    isPublic: true,
  },
  LESSON_RESOURCE: {
    folder: 'uploads/lessons/resources',
    maxSizeBytes: 100 * MB,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    isPublic: false,
  },
  LIVE_RECORDING: {
    folder: 'uploads/live/recordings',
    maxSizeBytes: 5 * GB,
    allowedMimeTypes: VIDEO_MIME_TYPES,
    isPublic: false,
  },
  COMMUNITY_IMAGE: {
    folder: 'uploads/community/images',
    maxSizeBytes: 10 * MB,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    isPublic: true,
  },
  COMMUNITY_VIDEO: {
    folder: 'uploads/community/videos',
    maxSizeBytes: 250 * MB,
    allowedMimeTypes: VIDEO_MIME_TYPES,
    isPublic: true,
  },
  CERTIFICATE: {
    folder: 'uploads/certificates',
    maxSizeBytes: 10 * MB,
    allowedMimeTypes: ['application/pdf'],
    isPublic: false,
  },
  TEMPORARY: {
    folder: 'uploads/temporary',
    maxSizeBytes: 250 * MB,
    allowedMimeTypes: [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES, ...DOCUMENT_MIME_TYPES],
    isPublic: false,
  },
};
