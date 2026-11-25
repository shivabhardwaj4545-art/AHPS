import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';
import { logAudit, extractClientMeta } from '../../middlewares/audit.js';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const clientMeta = extractClientMeta(req);

      const result = await AuthService.login(email, password, clientMeta);

      await logAudit({
        userId: result.user.id,
        employeeId: result.user.employee?.id,
        action: 'LOGIN',
        entity: 'AUTH',
        entityId: result.user.id,
        afterData: { email: result.user.email, role: result.user.role },
        ipAddress: clientMeta.ipAddress,
        userAgent: clientMeta.userAgent,
      });

      return sendSuccess(res, 'Login successful.', result);
    } catch (error) {
      return next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refresh(refreshToken);
      return sendSuccess(res, 'Token refreshed successfully.', tokens);
    } catch (error) {
      return next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      return sendSuccess(res, 'Logged out successfully.');
    } catch (error) {
      return next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, 'Current user profile fetched successfully.', {
        user: req.user,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      const meta = extractClientMeta(req);

      const result = await AuthService.changePassword(userId, currentPassword, newPassword);

      await logAudit({
        userId,
        action: 'UPDATE',
        entity: 'AUTH_PASSWORD',
        entityId: userId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return sendSuccess(res, result.message);
    } catch (error) {
      return next(error);
    }
  }
}

