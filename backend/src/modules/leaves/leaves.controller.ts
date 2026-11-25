import { Request, Response, NextFunction } from 'express';
import { LeavesService } from './leaves.service.js';
import { sendSuccess } from '../../utils/response.js';
import { LeaveRequestStatus, UserRole } from '@prisma/client';

export class LeavesController {
  static async listTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const types = await LeavesService.listLeaveTypes();
      return sendSuccess(res, 'Leave types fetched.', types);
    } catch (error) {
      return next(error);
    }
  }

  static async getBalances(req: Request, res: Response, next: NextFunction) {
    try {
      let employeeId = req.params.employeeId;
      if (req.user?.role === UserRole.TEACHER) {
        employeeId = req.user.employeeId!;
      }
      const balances = await LeavesService.getBalances(employeeId);
      return sendSuccess(res, 'Leave balances fetched.', balances);
    } catch (error) {
      return next(error);
    }
  }

  static async listRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const status = req.query.status as LeaveRequestStatus;
      let employeeId = req.query.employeeId as string;

      if (req.user?.role === UserRole.TEACHER) {
        employeeId = req.user.employeeId!;
      }

      const result = await LeavesService.listRequests({
        page,
        limit,
        status,
        employeeId,
      });

      return sendSuccess(res, 'Leave requests fetched.', result.requests, 200, result.meta);
    } catch (error) {
      return next(error);
    }
  }

  static async apply(req: Request, res: Response, next: NextFunction) {
    try {
      let employeeId = req.body.employeeId;
      if (req.user?.role === UserRole.TEACHER) {
        employeeId = req.user.employeeId!;
      }

      const request = await LeavesService.applyLeave({
        ...req.body,
        employeeId,
      });

      return sendSuccess(res, 'Leave request submitted successfully.', request, 201);
    } catch (error) {
      return next(error);
    }
  }

  static async review(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action, reviewComments } = req.body;
      const result = await LeavesService.reviewLeave(id, req.user!.id, action, reviewComments);
      return sendSuccess(res, `Leave request has been ${action.toLowerCase()}.`, result);
    } catch (error) {
      return next(error);
    }
  }
}

