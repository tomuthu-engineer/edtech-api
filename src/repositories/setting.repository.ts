import { Setting } from '@prisma/client';
import { prisma } from '@config/database';

class SettingRepository {
  findAll(category?: string): Promise<Setting[]> {
    return prisma.setting.findMany({ where: category ? { category } : undefined, orderBy: { key: 'asc' } });
  }

  findByKey(key: string): Promise<Setting | null> {
    return prisma.setting.findUnique({ where: { key } });
  }

  upsert(key: string, value: unknown, category: string, updatedBy: string): Promise<Setting> {
    return prisma.setting.upsert({
      where: { key },
      create: { key, value: value as never, category, updatedBy },
      update: { value: value as never, category, updatedBy },
    });
  }

  async delete(key: string): Promise<void> {
    await prisma.setting.delete({ where: { key } });
  }
}

export const settingRepository = new SettingRepository();
