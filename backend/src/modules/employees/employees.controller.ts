import { Request, Response, NextFunction } from 'express';
import { EmployeesService } from './employees.service.js';
import { sendSuccess } from '../../utils/response.js';
import { logAudit, extractClientMeta } from '../../middlewares/audit.js';
import { EmployeeStatus, UserRole } from '@prisma/client';

export class EmployeesController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = req.query.search as string;
      const branchId = req.query.branchId as string;
      const departmentId = req.query.departmentId as string;
      const status = req.query.status as EmployeeStatus;

      const result = await EmployeesService.listEmployees({
        page,
        limit,
        search,
        branchId,
        departmentId,
        status,
      });

      return sendSuccess(res, 'Employees fetched successfully.', result.employees, 200, result.meta);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const isPrivileged = req.user?.role === UserRole.SUPER_ADMIN || req.user?.role === UserRole.ADMIN;
      const employee = await EmployeesService.getEmployeeById(id, isPrivileged);
      return sendSuccess(res, 'Employee details fetched successfully.', employee);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meta = extractClientMeta(req);
      const employee = await EmployeesService.createEmployee(req.body);

      await logAudit({
        userId: req.user?.id,
        employeeId: employee.id,
        action: 'CREATE',
        entity: 'EMPLOYEE',
        entityId: employee.id,
        afterData: { employeeId: employee.employeeId, name: employee.name, designation: employee.designation },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return sendSuccess(res, `Teacher registered successfully with ID ${employee.employeeId}.`, employee, 201);
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const meta = extractClientMeta(req);
      const updated = await EmployeesService.updateEmployee(id, req.body);

      await logAudit({
        userId: req.user?.id,
        employeeId: id,
        action: 'UPDATE',
        entity: 'EMPLOYEE',
        entityId: id,
        afterData: req.body,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return sendSuccess(res, 'Employee updated successfully.', updated);
    } catch (error) {
      return next(error);
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const meta = extractClientMeta(req);
      const result = await EmployeesService.deactivateEmployee(id, reason);

      await logAudit({
        userId: req.user?.id,
        employeeId: id,
        action: 'DEACTIVATE',
        entity: 'EMPLOYEE',
        entityId: id,
        afterData: { status: 'INACTIVE', reason },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return sendSuccess(res, 'Teacher deactivated successfully.', result);
    } catch (error) {
      return next(error);
    }
  }

  static async mapDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { deviceId, deviceUserId } = req.body;
      const meta = extractClientMeta(req);

      const mapping = await EmployeesService.mapDevice(id, deviceId, deviceUserId);

      await logAudit({
        userId: req.user?.id,
        employeeId: id,
        action: 'MAP_DEVICE',
        entity: 'DEVICE_MAPPING',
        entityId: mapping.id,
        afterData: { deviceId, deviceUserId },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return sendSuccess(res, 'Biometric device user mapped successfully.', mapping);
    } catch (error) {
      return next(error);
    }
  }

  static async bulkImport(req: Request, res: Response, next: NextFunction) {
    try {
      const { records, branchId } = req.body;
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide an array of records to import.' });
      }

      const result = await EmployeesService.bulkImport(records, branchId);
      return sendSuccess(res, `Bulk import finished: ${result.imported} created, ${result.failed} failed.`, result);
    } catch (error) {
      return next(error);
    }
  }
}

