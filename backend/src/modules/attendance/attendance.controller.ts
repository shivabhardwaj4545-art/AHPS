import { Request, Response, NextFunction } from 'express';
import { AttendanceService, AttendanceProcessor } from './attendance.service.js';
import { sendSuccess } from '../../utils/response.js';
import { extractClientMeta } from '../../middlewares/audit.js';
import { formatDateOnly } from '../../utils/date.js';
import { prisma } from '../../config/db.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class AttendanceController {
  // Record Live Punch (Web Portal / Biometric Sync)
  static async punch(req: Request, res: Response, next: NextFunction) {
    try {
      const { punchType } = req.body;
      let targetEmployeeId = req.user?.employeeId;

      // Allow Admin/Super Admin to specify an employeeId to test or record punch on behalf
      if (['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '') && req.body.employeeId) {
        targetEmployeeId = req.body.employeeId;
      }

      if (!targetEmployeeId) {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
          include: { employee: true },
        });
        targetEmployeeId = user?.employee?.id || user?.employeeId;
        if (!targetEmployeeId) {
          const firstEmp = await prisma.employee.findFirst({ where: { status: 'ACTIVE' } });
          targetEmployeeId = firstEmp?.id;
        }
      }

      if (!targetEmployeeId) {
        throw new AppError('No employee profile associated with this account.', 400);
      }

      const clientMeta = extractClientMeta(req);
      const result = await AttendanceService.recordWebPunch({
        employeeId: targetEmployeeId,
        userId: req.user!.id,
        punchType: punchType || 'CHECK_IN',
        ipAddress: clientMeta?.ipAddress || undefined,
        userAgent: clientMeta?.userAgent || undefined,
      });

      return sendSuccess(res, `Punch ${punchType || 'IN'} registered successfully!`, result, 201);
    } catch (error) {
      return next(error);
    }
  }

  // Get Today's Live Punch Status & Shift Details
  static async getToday(req: Request, res: Response, next: NextFunction) {
    try {
      let targetEmployeeId = req.user?.employeeId;
      if (['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '') && req.query.employeeId) {
        targetEmployeeId = req.query.employeeId as string;
      }

      if (!targetEmployeeId) {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
          include: { employee: true },
        });
        targetEmployeeId = user?.employee?.id || user?.employeeId;
        if (!targetEmployeeId) {
          const firstEmp = await prisma.employee.findFirst({ where: { status: 'ACTIVE' } });
          targetEmployeeId = firstEmp?.id;
        }
      }

      if (!targetEmployeeId) {
        throw new AppError('No employee profile associated with this account.', 400);
      }

      const data = await AttendanceService.getTodayPunchStatus(targetEmployeeId);
      return sendSuccess(res, "Today's punch status fetched.", data);
    } catch (error) {
      return next(error);
    }
  }
  // Trigger on-demand attendance calculation
  static async processDaily(req: Request, res: Response, next: NextFunction) {
    try {
      const dateStr = (req.body.date as string) || formatDateOnly(new Date());
      const branchId = req.body.branchId as string;
      const result = await AttendanceProcessor.processDailyAttendance(new Date(dateStr), branchId);
      return sendSuccess(res, 'Daily attendance processed successfully.', result);
    } catch (error) {
      return next(error);
    }
  }

  // Get daily attendance view
  static async getDaily(req: Request, res: Response, next: NextFunction) {
    try {
      const dateStr = (req.query.date as string) || formatDateOnly(new Date());
      const branchId = req.query.branchId as string;
      const departmentId = req.query.departmentId as string;

      const records = await AttendanceService.getDailyAttendance(dateStr, branchId, departmentId);
      return sendSuccess(res, 'Daily attendance records fetched.', records);
    } catch (error) {
      return next(error);
    }
  }

  // Get monthly attendance grid
  static async getMonthly(req: Request, res: Response, next: NextFunction) {
    try {
      const monthStr = (req.query.month as string) || formatDateOnly(new Date()).slice(0, 7);
      const employeeId = req.query.employeeId as string;
      const branchId = req.query.branchId as string;

      // If user is a teacher, force filter to their own employee ID
      const targetEmpId = req.user?.role === 'TEACHER' ? req.user.employeeId! : employeeId;

      const records = await AttendanceService.getMonthlyGrid(monthStr, targetEmpId, branchId);
      return sendSuccess(res, 'Monthly attendance records fetched.', records);
    } catch (error) {
      return next(error);
    }
  }

  // Request regularization
  static async requestCorrection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // attendanceId
      const { requestedStatus, requestedFirstIn, requestedLastOut, reason } = req.body;

      const correction = await AttendanceService.requestCorrection({
        attendanceId: id,
        requestedById: req.user!.id,
        requestedStatus,
        requestedFirstIn,
        requestedLastOut,
        reason,
      });

      return sendSuccess(res, 'Attendance correction requested successfully.', correction, 201);
    } catch (error) {
      return next(error);
    }
  }

  // Review regularization request
  static async reviewCorrection(req: Request, res: Response, next: NextFunction) {
    try {
      const { correctionId } = req.params;
      const { action, rejectionReason } = req.body;
      const clientMeta = extractClientMeta(req);

      const result = await AttendanceService.reviewCorrection(
        correctionId,
        req.user!.id,
        action,
        rejectionReason,
        clientMeta
      );

      return sendSuccess(res, `Correction request has been ${action.toLowerCase()}.`, result);
    } catch (error) {
      return next(error);
    }
  }

  // Lock monthly attendance period
  static async lockPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const { month } = req.params; // "YYYY-MM"
      const { notes, branchId } = req.body;

      const locked = await AttendanceService.lockPeriod(month, req.user!.id, notes, branchId);
      return sendSuccess(res, `Attendance period for ${month} locked successfully.`, locked);
    } catch (error) {
      return next(error);
    }
  }
}

