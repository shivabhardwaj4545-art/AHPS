import { prisma } from '../../config/db.js';
import { LeaveRequestStatus, UserRole } from '@prisma/client';
import { AppError } from '../../middlewares/errorHandler.js';
import { differenceInCalendarDays } from 'date-fns';

export class LeavesService {
  static async listLeaveTypes() {
    return prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  static async getBalances(employeeId: string, year = new Date().getFullYear()) {
    return prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
    });
  }

  static async listRequests(params: {
    employeeId?: string;
    status?: LeaveRequestStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.status) where.status = params.status;

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            select: { id: true, employeeId: true, name: true, designation: true },
          },
          leaveType: true,
          approvedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return {
      requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async applyLeave(data: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    isHalfDay?: boolean;
    reason: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end < start) {
      throw new AppError('End date cannot be earlier than start date.', 400);
    }

    const totalDays = data.isHalfDay ? 0.5 : differenceInCalendarDays(end, start) + 1;
    const currentYear = start.getFullYear();

    // Check balance for paid leaves
    const leaveType = await prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } });
    if (!leaveType) throw new AppError('Leave type not found.', 404);

    if (leaveType.isPaid) {
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: data.employeeId,
            leaveTypeId: data.leaveTypeId,
            year: currentYear,
          },
        },
      });

      const available = balance ? balance.allocatedDays - balance.usedDays - balance.pendingDays : 0;
      if (available < totalDays) {
        throw new AppError(
          `Insufficient leave balance. Requested: ${totalDays} days, Available: ${available} days.`,
          400
        );
      }

      // Increment pending count
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { pendingDays: balance.pendingDays + totalDays },
        });
      }
    }

    return prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        isHalfDay: Boolean(data.isHalfDay),
        reason: data.reason,
        status: LeaveRequestStatus.PENDING,
      },
    });
  }

  static async reviewLeave(
    requestId: string,
    reviewedById: string,
    action: 'APPROVED' | 'REJECTED',
    reviewComments?: string
  ) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { leaveType: true },
    });

    if (!request) throw new AppError('Leave request not found.', 404);
    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new AppError(`Leave request is already ${request.status}.`, 400);
    }

    const currentYear = request.startDate.getFullYear();

    return prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: action as LeaveRequestStatus,
          approvedById: reviewedById,
          reviewedAt: new Date(),
          reviewComments,
        },
      });

      if (request.leaveType.isPaid) {
        const balance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              year: currentYear,
            },
          },
        });

        if (balance) {
          if (action === 'APPROVED') {
            await tx.leaveBalance.update({
              where: { id: balance.id },
              data: {
                usedDays: balance.usedDays + request.totalDays,
                pendingDays: Math.max(0, balance.pendingDays - request.totalDays),
              },
            });
          } else {
            await tx.leaveBalance.update({
              where: { id: balance.id },
              data: {
                pendingDays: Math.max(0, balance.pendingDays - request.totalDays),
              },
            });
          }
        }
      }

      return updated;
    });
  }
}

