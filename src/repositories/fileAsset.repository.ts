import { FileAsset, Prisma } from '@prisma/client';
import { prisma } from '@config/database';

class FileAssetRepository {
  create(data: Prisma.FileAssetCreateInput): Promise<FileAsset> {
    return prisma.fileAsset.create({ data });
  }

  findById(id: string): Promise<FileAsset | null> {
    return prisma.fileAsset.findUnique({ where: { id } });
  }

  findByKey(key: string): Promise<FileAsset | null> {
    return prisma.fileAsset.findUnique({ where: { key } });
  }

  delete(id: string): Promise<FileAsset> {
    return prisma.fileAsset.delete({ where: { id } });
  }
}

export const fileAssetRepository = new FileAssetRepository();
