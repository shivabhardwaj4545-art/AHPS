import { Request, Response, NextFunction } from 'express';
import { AuditLogsService } from './auditLogs.service.js';
import { sendSuccess } from '../../utils/response.js';

export class AuditLogsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const entity = req.query.entity as string;
      const action = req.query.action as string;
      const userId = req.query.userId as string;

      const result = await AuditLogsService.listLogs({
        page,
        limit,
        entity,
        action,
        userId,
      });

      return sendSuccess(res, 'Audit logs fetched.', result.logs, 200, result.meta);
    } catch (error) {
      return next(error);
    }
  }
}

