import { S3Client } from '@aws-sdk/client-s3';
import { env } from '@config/env';

/**
 * Single reusable S3 client for the whole app. Never instantiate the AWS
 * SDK anywhere else — everything goes through StorageService.
 */
export const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials:
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY }
      : undefined,
});
