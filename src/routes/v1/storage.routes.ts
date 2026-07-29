import { Router } from 'express';
import { storageController } from '@controllers/storage.controller';
import { authenticate } from '@middlewares/authenticate.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { directUpload } from '@middlewares/upload.middleware';
import {
  signedUploadUrlValidator,
  fileIdParamValidator,
  uploadFileValidator,
} from '@validators/storage.validator';

export const storageRouter = Router();

storageRouter.use(authenticate);

/**
 * @openapi
 * /storage/upload/{entityType}:
 *   post:
 *     tags: [Storage]
 *     summary: Direct multipart upload (images, documents — max 100MB)
 *     description: >
 *       For LESSON_VIDEO and LIVE_RECORDING specifically, this always
 *       returns 400 — those go through POST /storage/signed-upload-url
 *       instead (see that endpoint's description for the 3-step flow).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: File uploaded }
 *       400: { description: "entityType requires the signed-upload-url flow instead, or file exceeds the per-type size/MIME limit" }
 */
storageRouter.post(
  '/upload/:entityType',
  validateRequest(uploadFileValidator),
  directUpload.single('file'),
  storageController.uploadFile,
);

/**
 * @openapi
 * /storage/signed-upload-url:
 *   post:
 *     tags: [Storage]
 *     summary: Get a pre-signed S3 URL for large/video uploads
 *     description: >
 *       Step 1 of 3 for lesson videos / live recordings. This does NOT upload
 *       anything — it only returns a `uploadUrl` (a direct S3 link, valid
 *       `AWS_S3_SIGNED_URL_EXPIRES_IN` seconds) and the `key` that URL
 *       corresponds to. Step 2: `PUT` your file's raw bytes to `uploadUrl`
 *       directly (NOT through this API — Swagger's "Try it out" cannot do
 *       this step; use curl/Postman/your app's HTTP client). Step 3: call
 *       `POST /lessons/{lessonId}/video` with the `key` from this response.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SignedUploadUrlBody' }
 *     responses:
 *       200: { description: Signed upload URL issued }
 *       400: { description: Validation failed (unsupported MIME type for this entityType) }
 */
storageRouter.post(
  '/signed-upload-url',
  validateRequest(signedUploadUrlValidator),
  storageController.getSignedUploadUrl,
);

/**
 * @openapi
 * /storage/{id}/signed-download-url:
 *   get:
 *     tags: [Storage]
 *     summary: Get a signed, expiring download URL for a private file
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200: { description: Signed download URL issued }
 */
storageRouter.get(
  '/:id/signed-download-url',
  validateRequest(fileIdParamValidator),
  storageController.getSignedDownloadUrl,
);

/**
 * @openapi
 * /storage/{id}:
 *   delete:
 *     tags: [Storage]
 *     summary: Delete a file (owner or staff only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200: { description: File deleted }
 */
storageRouter.delete('/:id', validateRequest(fileIdParamValidator), storageController.deleteFile);
