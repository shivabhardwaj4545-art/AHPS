import { prisma } from '../../config/db.js';

export class SettingsService {
  static async listSettings(group?: string) {
    const where = group ? { group } : {};
    return prisma.setting.findMany({ where, orderBy: { key: 'asc' } });
  }

  static async updateSetting(key: string, value: string) {
    return prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  static async getSettingByKey(key: string): Promise<string | null> {
    const s = await prisma.setting.findUnique({ where: { key } });
    return s ? s.value : null;
  }
}

