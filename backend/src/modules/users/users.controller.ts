import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service.js';
import { sendSuccess } from '../../utils/response.js';
import { logAudit, extractClientMeta } from '../../middlewares/audit.js';
import { UserRole } from '@prisma/client';

export class UsersController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const role = req.query.role as UserRole | undefined;
      const search = req.query.search as string | undefined;

      const result = await UsersService.listUsers(page, limit, role, search);
      return sendSuccess(res, 'Users retrieved successfully.', result.users, 200, result.meta);
    } catch (error) {
      return next(error);
    }
  }

  static async getByEmployeeId(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const user = await UsersService.getUserByEmployeeId(employeeId);
      return sendSuccess(res, 'User profile fetched.', user);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = extractClientMeta(req);
      const user = await UsersService.createUser(req.body);

      await logAudit({
        userId: req.user?.id,
        action: 'CREATE',
        entity: 'USER',
        entityId: user.id,
        afterData: { email: user.email, role: user.role, name: user.name },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return sendSuccess(res, 'User created successfully.', user, 201);
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const meta = extractClientMeta(req);

      const user = await UsersService.updateUser(id, req.body);

      await logAudit({
        userId: req.user?.id,
        action: 'UPDATE_CREDENTIALS',
        entity: 'USER',
        entityId: id,
        afterData: {
          email: user.email,
          role: user.role,
          name: user.name,
          isActive: user.isActive,
          passwordChanged: Boolean(req.body.password),
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return sendSuccess(res, 'User credentials updated successfully.', user);
    } catch (error) {
      return next(error);
    }
  }

  static async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const meta = extractClientMeta(req);
      const user = await UsersService.toggleActive(id, Boolean(isActive));

      await logAudit({
        userId: req.user?.id,
        action: 'UPDATE_STATUS',
        entity: 'USER',
        entityId: id,
        afterData: { isActive },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return sendSuccess(res, `User account ${isActive ? 'activated' : 'deactivated'} successfully.`, user);
    } catch (error) {
      return next(error);
    }
  }
}
