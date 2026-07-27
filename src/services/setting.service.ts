import { settingRepository } from '@repositories/setting.repository';
import { auditLogService } from '@services/auditLog.service';
import { NotFoundError } from '@utils/errors';
import { redisClient } from '@config/redis';

const CACHE_PREFIX = 'settings:';
const CACHE_TTL_SECONDS = 300;

class SettingService {
  list(category?: string) {
    return settingRepository.findAll(category);
  }

  async get(key: string) {
    const cached = await redisClient.get(`${CACHE_PREFIX}${key}`);
    if (cached) return JSON.parse(cached);

    const setting = await settingRepository.findByKey(key);
    if (!setting) throw new NotFoundError('Setting');

    await redisClient.set(`${CACHE_PREFIX}${key}`, JSON.stringify(setting), 'EX', CACHE_TTL_SECONDS);
    return setting;
  }

  async set(key: string, value: unknown, category: string, actorId: string) {
    const setting = await settingRepository.upsert(key, value, category, actorId);
    await redisClient.del(`${CACHE_PREFIX}${key}`);

    await auditLogService.record({
      actorId,
      action: 'UPDATE',
      entityType: 'Setting',
      entityId: key,
      metadata: { value },
    });

    return setting;
  }

  async remove(key: string, actorId: string) {
    await settingRepository.delete(key);
    await redisClient.del(`${CACHE_PREFIX}${key}`);
    await auditLogService.record({ actorId, action: 'DELETE', entityType: 'Setting', entityId: key });
  }
}

export const settingService = new SettingService();
