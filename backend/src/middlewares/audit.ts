import { Request } from 'express';
import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';

export interface AuditLogOptions {
  userId?: string | null;
  employeeId?: string | null;
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'APPROVE', 'LOCK', 'EXPORT'
  entity: string; // 'EMPLOYEE', 'ATTENDANCE', 'PAYROLL', 'LEAVE', 'SETTINGS', 'AUTH'
  entityId?: string | null;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export const logAudit = async (options: AuditLogOptions): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId || null,
        employeeId: options.employeeId || null,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId || null,
        beforeData: options.beforeData ? JSON.stringify(options.beforeData) : null,
        afterData: options.afterData ? JSON.stringify(options.afterData) : null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      },
    });
  } catch (err: any) {
    logger.error(`Failed to record audit log: ${err.message}`);
  }
};

export const extractClientMeta = (req: Request) => {
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    null;
  const userAgent = req.headers['user-agent'] || null;
  return { ipAddress, userAgent };
};

