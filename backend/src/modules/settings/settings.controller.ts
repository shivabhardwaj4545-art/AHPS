import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service.js';
import { sendSuccess } from '../../utils/response.js';
import { logAudit, extractClientMeta } from '../../middlewares/audit.js';

export class SettingsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const group = req.query.group as string;
      const settings = await SettingsService.listSettings(group);
      return sendSuccess(res, 'Settings fetched successfully.', settings);
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { key, value } = req.body;
      const meta = extractClientMeta(req);
      const updated = await SettingsService.updateSetting(key, typeof value === 'object' ? JSON.stringify(value) : String(value));

      await logAudit({
        userId: req.user?.id,
        action: 'UPDATE_SETTING',
        entity: 'SETTINGS',
        entityId: key,
        afterData: { key, value },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return sendSuccess(res, `Setting ${key} updated successfully.`, updated);
    } catch (error) {
      return next(error);
    }
  }
}

