import { Request, Response } from 'express';
import { FileEntityType } from '@prisma/client';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { ValidationError } from '@utils/errors';
import { fileAssetService } from '@services/fileAsset.service';
import { storageService } from '@storage/storage.service';

const SIGNED_URL_ONLY_ENTITY_TYPES = new Set<FileEntityType>([
  FileEntityType.LESSON_VIDEO,
  FileEntityType.LIVE_RECORDING,
]);

/** Controllers only validate, delegate, and shape the response — no AWS SDK calls here. */
export const storageController = {
  uploadFile: asyncHandler(async (req: Request, res: Response) => {
    const entityType = req.params.entityType as FileEntityType;

    if (SIGNED_URL_ONLY_ENTITY_TYPES.has(entityType)) {
      throw new ValidationError('This file type must be uploaded via the signed upload URL flow', [
        { field: 'entityType', message: 'Use POST /storage/signed-upload-url instead' },
      ]);
    }

    if (!req.file) {
      throw new ValidationError('No file provided', [{ field: 'file', message: 'file is required' }]);
    }

    const asset = await fileAssetService.uploadFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      entityType,
      uploadedBy: req.user!.id,
    });

    ApiResponse.created(res, 'File uploaded successfully', asset);
  }),

  getSignedUploadUrl: asyncHandler(async (req: Request, res: Response) => {
    const result = await storageService.generateSignedUploadUrl(req.body);
    ApiResponse.success(res, { message: 'Signed upload URL generated', data: result });
  }),

  getSignedDownloadUrl: asyncHandler(async (req: Request, res: Response) => {
    const url = await fileAssetService.getSignedDownloadUrl(req.params.id);
    ApiResponse.success(res, { message: 'Signed download URL generated', data: { url } });
  }),

  deleteFile: asyncHandler(async (req: Request, res: Response) => {
    await fileAssetService.deleteFile(req.params.id, req.user!.id, req.user!.roles);
    ApiResponse.success(res, { message: 'File deleted successfully', data: null });
  }),
};
