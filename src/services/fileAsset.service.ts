import { FileEntityType } from '@prisma/client';
import { storageService } from '@storage/storage.service';
import { fileAssetRepository } from '@repositories/fileAsset.repository';
import { NotFoundError, AuthorizationError } from '@utils/errors';
import { Role } from '@constants/roles.constant';
import { STAFF_ROLES } from '@constants/roles.constant';

interface UploadFileArgs {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  entityType: FileEntityType;
  uploadedBy: string;
}

/**
 * Orchestrates upload/delete/replace across StorageService (S3) and
 * FileAsset (Postgres metadata) so callers never juggle both directly.
 */
class FileAssetService {
  async uploadFile(args: UploadFileArgs) {
    const result = await storageService.upload(args);

    const asset = await fileAssetRepository.create({
      originalName: result.originalName,
      fileName: result.fileName,
      bucket: result.bucket,
      key: result.key,
      url: result.url,
      entityType: args.entityType,
      mimeType: result.mimeType,
      size: result.size,
      extension: result.extension,
      isPublic: result.isPublic,
      uploader: { connect: { id: args.uploadedBy } },
    });

    return asset;
  }

  async replaceFile(fileId: string, args: UploadFileArgs, requesterId: string, requesterRoles: Role[]) {
    const existing = await fileAssetRepository.findById(fileId);
    if (!existing) throw new NotFoundError('File');
    this.assertOwnerOrStaff(existing.uploadedBy, requesterId, requesterRoles);

    const result = await storageService.replace(existing.key, args);
    await fileAssetRepository.delete(fileId);

    return fileAssetRepository.create({
      originalName: result.originalName,
      fileName: result.fileName,
      bucket: result.bucket,
      key: result.key,
      url: result.url,
      entityType: args.entityType,
      mimeType: result.mimeType,
      size: result.size,
      extension: result.extension,
      isPublic: result.isPublic,
      uploader: { connect: { id: args.uploadedBy } },
    });
  }

  async deleteFile(fileId: string, requesterId: string, requesterRoles: Role[]): Promise<void> {
    const existing = await fileAssetRepository.findById(fileId);
    if (!existing) throw new NotFoundError('File');
    this.assertOwnerOrStaff(existing.uploadedBy, requesterId, requesterRoles);

    await storageService.delete(existing.key);
    await fileAssetRepository.delete(fileId);
  }

  async getSignedDownloadUrl(fileId: string): Promise<string> {
    const asset = await fileAssetRepository.findById(fileId);
    if (!asset) throw new NotFoundError('File');
    if (asset.isPublic) return asset.url ?? storageService.getPublicUrl(asset.key);
    return storageService.generateSignedDownloadUrl(asset.key);
  }

  private assertOwnerOrStaff(ownerId: string, requesterId: string, requesterRoles: Role[]): void {
    const isOwner = ownerId === requesterId;
    const isStaff = requesterRoles.some((role) => STAFF_ROLES.includes(role));
    if (!isOwner && !isStaff) {
      throw new AuthorizationError('You do not have permission to modify this file');
    }
  }
}

export const fileAssetService = new FileAssetService();
