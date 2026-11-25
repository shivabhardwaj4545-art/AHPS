import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { sendError } from '../utils/response.js';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', undefined, 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
        undefined,
        403
      );
    }

    return next();
  };
};

// Guard: Teachers can ONLY view or modify their own data
export const enforceTeacherSelfOnly = (
  employeeIdGetter: (req: Request) => string | undefined | null
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', undefined, 401);
    }

    // Super Admin and Admin can view any employee
    if (req.user.role === UserRole.SUPER_ADMIN || req.user.role === UserRole.ADMIN) {
      return next();
    }

    // Teacher role MUST match their own employee ID
    const targetEmployeeId = employeeIdGetter(req);
    if (!targetEmployeeId || !req.user.employeeId || req.user.employeeId !== targetEmployeeId) {
      return sendError(
        res,
        'Access denied: You are only authorized to access your own employee profile, attendance, leaves, and payslips.',
        undefined,
        403
      );
    }

    return next();
  };
};

