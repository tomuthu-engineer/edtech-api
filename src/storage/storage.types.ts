import { FileEntityType } from '@prisma/client';

export interface UploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  entityType: FileEntityType;
  uploadedBy: string;
}

export interface UploadResult {
  key: string;
  bucket: string;
  url: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  extension: string;
  isPublic: boolean;
}

export interface SignedUploadUrlInput {
  originalName: string;
  mimeType: string;
  entityType: FileEntityType;
}

export interface SignedUploadUrlResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
  publicUrl: string;
}
