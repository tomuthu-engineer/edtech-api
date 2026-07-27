import multer from 'multer';

/**
 * Direct-to-API multipart upload, capped at 100MB (the largest entity type
 * we accept this way — course resources). Anything larger (lesson videos,
 * live recordings, community videos) MUST use the signed-upload-URL flow
 * (POST /storage/signed-upload-url) so the client streams straight to S3
 * instead of buffering multi-GB files through this process's memory.
 * StorageService re-validates the exact per-entity-type mime/size rule
 * regardless — this is just the outer guard rail.
 */
export const MAX_DIRECT_UPLOAD_BYTES = 100 * 1024 * 1024;

export const directUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DIRECT_UPLOAD_BYTES },
});
