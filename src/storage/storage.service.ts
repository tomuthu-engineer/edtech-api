import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { FileEntityType } from '@prisma/client';
import { s3Client } from '@storage/s3Client';
import { FILE_ENTITY_RULES } from '@storage/storage.constant';
import { UploadInput, UploadResult, SignedUploadUrlInput, SignedUploadUrlResult } from '@storage/storage.types';
import { env } from '@config/env';
import { ValidationError } from '@utils/errors';
import { createChildLogger } from '@config/logger';

const logger = createChildLogger('storage-service');

/**
 * Sole gateway to AWS S3. Controllers and services must never touch the AWS
 * SDK directly — every upload/delete/URL-signing flow funnels through here
 * so validation, key naming, and CDN rewriting stay consistent.
 */
class StorageService {
  private validate(entityType: FileEntityType, mimeType: string, size: number): void {
    const rule = FILE_ENTITY_RULES[entityType];

    if (!rule.allowedMimeTypes.includes(mimeType)) {
      throw new ValidationError('Unsupported file type', [
        { field: 'file', message: `Allowed types for ${entityType}: ${rule.allowedMimeTypes.join(', ')}` },
      ]);
    }

    if (size > rule.maxSizeBytes) {
      const maxMb = Math.round(rule.maxSizeBytes / (1024 * 1024));
      throw new ValidationError('File exceeds maximum allowed size', [
        { field: 'file', message: `Maximum size for ${entityType} is ${maxMb}MB` },
      ]);
    }
  }

  private buildKey(entityType: FileEntityType, originalName: string): string {
    const rule = FILE_ENTITY_RULES[entityType];
    const extension = (mime.extension(mime.lookup(originalName) || '') || 'bin') as string;
    return `${rule.folder}/${uuidv4()}.${extension}`;
  }

  /** Never expose raw S3 keys — routes through CloudFront when configured. */
  getPublicUrl(key: string): string {
    if (env.AWS_CLOUDFRONT_URL) {
      return `${env.AWS_CLOUDFRONT_URL.replace(/\/$/, '')}/${key}`;
    }
    return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    this.validate(input.entityType, input.mimeType, input.size);

    const rule = FILE_ENTITY_RULES[input.entityType];
    const key = this.buildKey(input.entityType, input.originalName);
    const extension = key.split('.').pop() ?? 'bin';

    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
        ACL: rule.isPublic ? 'public-read' : 'private',
        Metadata: { uploadedBy: input.uploadedBy, originalName: input.originalName },
      }),
    );

    logger.info({ key, entityType: input.entityType }, 'File uploaded to S3');

    return {
      key,
      bucket: env.AWS_S3_BUCKET,
      url: this.getPublicUrl(key),
      fileName: key.split('/').pop() ?? key,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      extension,
      isPublic: rule.isPublic,
    };
  }

  async delete(key: string): Promise<void> {
    await s3Client.send(new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }));
    logger.info({ key }, 'File deleted from S3');
  }

  /** Deletes the old object (if any) and uploads the replacement under a fresh key. */
  async replace(oldKey: string | null | undefined, input: UploadInput): Promise<UploadResult> {
    const result = await this.upload(input);
    if (oldKey) {
      await this.delete(oldKey).catch((err) =>
        logger.warn({ err, oldKey }, 'Failed to delete previous file during replace'),
      );
    }
    return result;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  /** Client uploads directly to S3 using this URL — keeps large files off our API tier. */
  async generateSignedUploadUrl(input: SignedUploadUrlInput): Promise<SignedUploadUrlResult> {
    this.validate(input.entityType, input.mimeType, 0);
    const key = this.buildKey(input.entityType, input.originalName);

    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      ContentType: input.mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: env.AWS_S3_SIGNED_URL_EXPIRES_IN,
    });

    return {
      uploadUrl,
      key,
      expiresIn: env.AWS_S3_SIGNED_URL_EXPIRES_IN,
      publicUrl: this.getPublicUrl(key),
    };
  }

  /** For private objects (lesson videos, resources) that require an authorized, expiring link. */
  async generateSignedDownloadUrl(key: string, expiresIn = env.AWS_S3_SIGNED_URL_EXPIRES_IN): Promise<string> {
    const command = new GetObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key });
    return getSignedUrl(s3Client, command, { expiresIn });
  }
}

export const storageService = new StorageService();
