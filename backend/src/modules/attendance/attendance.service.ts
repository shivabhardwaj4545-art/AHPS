import { prisma } from '../../config/db.js';
import {
  AttendanceStatus,
  CorrectionStatus,
  EmployeeStatus,
  UserRole,
  PunchType,
  VerifyType,
  SyncStatus,
} from '@prisma/client';
import { formatDateOnly, toIST, parseTimeToDate, calculateMinutesBetween } from '../../utils/date.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { logAudit } from '../../middlewares/audit.js';
import { startOfDay, endOfDay, getDay, isAfter, isBefore } from 'date-fns';

export class AttendanceProcessor {
  /**
   * Process and calculate daily attendance for all active employees for a given date
   */
  static async processDailyAttendance(targetDate: Date = new Date(), branchId?: string) {
    const istDate = toIST(targetDate);
    const dateStr = formatDateOnly(istDate);
    const monthStr = dateStr.slice(0, 7); // "YYYY-MM"
    const dayStart = startOfDay(istDate);
    const dayEnd = endOfDay(istDate);
    const dayOfWeek = getDay(istDate); // 0 = Sunday, 1 = Monday...

    // 1. Check if Attendance Period is locked
    const lockedPeriod = await prisma.attendancePeriod.findFirst({
      where: {
        month: monthStr,
        isLocked: true,
        ...(branchId ? { branchId } : {}),
      },
    });

    if (lockedPeriod) {
      throw new AppError(`Attendance period for ${monthStr} is LOCKED. No automated modifications allowed.`, 403);
    }

    // 2. Fetch active employees
    const employees = await prisma.employee.findMany({
      where: {
        status: EmployeeStatus.ACTIVE,
        deletedAt: null,
        joiningDate: { lte: dayEnd },
        ...(branchId ? { branchId } : {}),
      },
      include: {
        shift: true,
        branch: {
          include: {
            weeklyOffs: true,
            holidays: {
              where: {
                date: {
                  gte: dayStart,
                  lte: dayEnd,
                },
              },
            },
          },
        },
        deviceMaps: true,
      },
    });

    const defaultShift = await prisma.shift.findFirst({
      where: { isDefault: true },
    });

    const summary = {
      present: 0,
      late: 0,
      halfDay: 0,
      absent: 0,
      onLeave: 0,
      holiday: 0,
      weeklyOff: 0,
      missingPunch: 0,
    };

    for (const emp of employees) {
      const shift = emp.shift || defaultShift;
      if (!shift) continue;

      // Check Holiday
      if (emp.branch.holidays.length > 0) {
        await this.upsertAttendanceRecord({
          employeeId: emp.id,
          date: dayStart,
          shiftId: shift.id,
          status: AttendanceStatus.HOLIDAY,
          isFlaggedForReview: false,
          reviewReason: emp.branch.holidays[0].name,
        });
        summary.holiday++;
        continue;
      }

      // Check Weekly Off
      const isWeeklyOff = emp.branch.weeklyOffs.some((wo) => wo.dayOfWeek === dayOfWeek && !wo.isHalfDay);
      if (isWeeklyOff) {
        await this.upsertAttendanceRecord({
          employeeId: emp.id,
          date: dayStart,
          shiftId: shift.id,
          status: AttendanceStatus.WEEKLY_OFF,
          isFlaggedForReview: false,
        });
        summary.weeklyOff++;
        continue;
      }

      // Check Approved Leave
      const approvedLeave = await prisma.leaveRequest.findFirst({
        where: {
          employeeId: emp.id,
          status: 'APPROVED',
          startDate: { lte: dayEnd },
          endDate: { gte: dayStart },
        },
        include: { leaveType: true },
      });

      if (approvedLeave) {
        await this.upsertAttendanceRecord({
          employeeId: emp.id,
          date: dayStart,
          shiftId: shift.id,
          status: AttendanceStatus.ON_LEAVE,
          isFlaggedForReview: false,
          reviewReason: `Approved Leave: ${approvedLeave.leaveType.name}`,
        });
        summary.onLeave++;
        continue;
      }

      // Collect mapped device user IDs for this employee
      const mappedUserIds = emp.deviceMaps.map((m) => m.deviceUserId);

      // Fetch all raw punch events for today
      const punches = await prisma.rawPunchEvent.findMany({
        where: {
          deviceUserId: { in: mappedUserIds },
          punchTime: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        orderBy: { punchTime: 'asc' },
      });

      // Scenario: No punches
      if (punches.length === 0) {
        await this.upsertAttendanceRecord({
          employeeId: emp.id,
          date: dayStart,
          shiftId: shift.id,
          status: AttendanceStatus.ABSENT,
          totalMinutes: 0,
          lateMinutes: 0,
          earlyMinutes: 0,
          isFlaggedForReview: false,
        });
        summary.absent++;
        continue;
      }

      // Scenario: Single punch only -> NEVER assume full day! Flag for Admin review!
      if (punches.length === 1) {
        const singlePunch = punches[0];
        await this.upsertAttendanceRecord({
          employeeId: emp.id,
          date: dayStart,
          shiftId: shift.id,
          firstIn: singlePunch.punchTime,
          lastOut: null,
          totalMinutes: 0,
          status: AttendanceStatus.MISSING_PUNCH,
          isFlaggedForReview: true,
          reviewReason: 'Single punch detected. Missing OUT punch. Requires Admin review/regularization.',
        });
        summary.missingPunch++;
        continue;
      }

      // Scenario: Multiple punches (First IN and Last OUT)
      const firstIn = punches[0].punchTime;
      const lastOut = punches[punches.length - 1].punchTime;
      const totalMinutes = calculateMinutesBetween(firstIn, lastOut);

      // Parse shift schedule for this date
      const shiftStart = parseTimeToDate(shift.startTime, dayStart);
      const shiftEnd = parseTimeToDate(shift.endTime, dayStart);
      const graceCutoff = new Date(shiftStart.getTime() + shift.gracePeriodMinutes * 60 * 1000);

      // Calculate Late Arrival minutes
      let lateMinutes = 0;
      if (isAfter(firstIn, graceCutoff)) {
        lateMinutes = calculateMinutesBetween(shiftStart, firstIn);
      }

      // Calculate Early Exit minutes
      let earlyMinutes = 0;
      if (isBefore(lastOut, shiftEnd)) {
        earlyMinutes = calculateMinutesBetween(lastOut, shiftEnd);
      }

      // Determine Attendance Status
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      let flagged = false;
      let reviewReason: string | null = null;

      if (totalMinutes < shift.halfDayMinimumMinutes) {
        status = AttendanceStatus.HALF_DAY;
        flagged = true;
        reviewReason = `Worked ${totalMinutes} mins (less than half-day minimum ${shift.halfDayMinimumMinutes} mins)`;
      } else if (totalMinutes < shift.fullDayMinimumMinutes) {
        status = AttendanceStatus.HALF_DAY;
      } else if (lateMinutes > 0) {
        status = AttendanceStatus.LATE;
      }

      await this.upsertAttendanceRecord({
        employeeId: emp.id,
        date: dayStart,
        shiftId: shift.id,
        firstIn,
        lastOut,
        totalMinutes,
        lateMinutes,
        earlyMinutes,
        status,
        isFlaggedForReview: flagged,
        reviewReason,
      });

      if (status === AttendanceStatus.PRESENT) summary.present++;
      else if (status === AttendanceStatus.LATE) summary.late++;
      else if (status === AttendanceStatus.HALF_DAY) summary.halfDay++;
    }

    return {
      date: dateStr,
      processedCount: employees.length,
      summary,
    };
  }

  private static async upsertAttendanceRecord(data: {
    employeeId: string;
    date: Date;
    shiftId: string;
    firstIn?: Date | null;
    lastOut?: Date | null;
    totalMinutes?: number;
    lateMinutes?: number;
    earlyMinutes?: number;
    status: AttendanceStatus;
    isFlaggedForReview?: boolean;
    reviewReason?: string | null;
  }) {
    // If manually regularized earlier, do not overwrite with automated run
    const existing = await prisma.dailyAttendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: data.date,
        },
      },
    });

    if (existing && existing.isRegularized) {
      return existing;
    }

    return prisma.dailyAttendance.upsert({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: data.date,
        },
      },
      update: {
        shiftId: data.shiftId,
        firstIn: data.firstIn,
        lastOut: data.lastOut,
        totalMinutes: data.totalMinutes || 0,
        lateMinutes: data.lateMinutes || 0,
        earlyMinutes: data.earlyMinutes || 0,
        status: data.status,
        isFlaggedForReview: data.isFlaggedForReview || false,
        reviewReason: data.reviewReason || null,
      },
      create: {
        employeeId: data.employeeId,
        date: data.date,
        shiftId: data.shiftId,
        firstIn: data.firstIn,
        lastOut: data.lastOut,
        totalMinutes: data.totalMinutes || 0,
        lateMinutes: data.lateMinutes || 0,
        earlyMinutes: data.earlyMinutes || 0,
        status: data.status,
        isFlaggedForReview: data.isFlaggedForReview || false,
        reviewReason: data.reviewReason || null,
      },
    });
  }
}

export class AttendanceService {
  static async getDailyAttendance(dateStr: string, branchId?: string, departmentId?: string) {
    const targetDate = startOfDay(toIST(dateStr));

    const where: any = {
      date: targetDate,
    };

    if (departmentId || branchId) {
      where.employee = {};
      if (departmentId) where.employee.departmentId = departmentId;
      if (branchId) where.employee.branchId = branchId;
    }

    return prisma.dailyAttendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            designation: true,
            department: { select: { name: true } },
          },
        },
        shift: {
          select: { name: true, startTime: true, endTime: true },
        },
      },
      orderBy: { employee: { employeeId: 'asc' } },
    });
  }

  static async getMonthlyGrid(monthStr: string, employeeId?: string, branchId?: string) {
    // monthStr: "YYYY-MM"
    const startDate = new Date(`${monthStr}-01T00:00:00.000Z`);
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = new Date(`${monthStr}-${String(daysInMonth).padStart(2, '0')}T23:59:59.999Z`);

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (employeeId) where.employeeId = employeeId;
    if (branchId) where.employee = { branchId };

    const records = await prisma.dailyAttendance.findMany({
      where,
      include: {
        employee: {
          select: { id: true, employeeId: true, name: true, designation: true },
        },
      },
      orderBy: [{ employeeId: 'asc' }, { date: 'asc' }],
    });

    return records;
  }

  // Request Attendance Regularization / Correction
  static async requestCorrection(data: {
    attendanceId: string;
    requestedById: string;
    requestedStatus: AttendanceStatus;
    requestedFirstIn?: string;
    requestedLastOut?: string;
    reason: string;
  }) {
    const attendance = await prisma.dailyAttendance.findUnique({
      where: { id: data.attendanceId },
      include: { employee: true },
    });

    if (!attendance) throw new AppError('Attendance record not found.', 404);

    // Check if period is locked
    const monthStr = formatDateOnly(attendance.date).slice(0, 7);
    const period = await prisma.attendancePeriod.findFirst({
      where: { month: monthStr, isLocked: true },
    });
    if (period) {
      throw new AppError('Cannot request correction for a locked attendance period.', 403);
    }

    return prisma.attendanceCorrection.create({
      data: {
        attendanceId: attendance.id,
        employeeId: attendance.employeeId,
        requestedById: data.requestedById,
        originalStatus: attendance.status,
        requestedStatus: data.requestedStatus,
        originalFirstIn: attendance.firstIn,
        requestedFirstIn: data.requestedFirstIn ? new Date(data.requestedFirstIn) : null,
        originalLastOut: attendance.lastOut,
        requestedLastOut: data.requestedLastOut ? new Date(data.requestedLastOut) : null,
        reason: data.reason,
        status: CorrectionStatus.PENDING,
      },
    });
  }

  // Review Correction (Approve/Reject)
  static async reviewCorrection(
    correctionId: string,
    reviewedById: string,
    action: 'APPROVED' | 'REJECTED',
    rejectionReason?: string,
    clientMeta?: any
  ) {
    const correction = await prisma.attendanceCorrection.findUnique({
      where: { id: correctionId },
      include: { attendance: true },
    });

    if (!correction) throw new AppError('Correction request not found.', 404);
    if (correction.status !== CorrectionStatus.PENDING) {
      throw new AppError(`Correction is already ${correction.status}.`, 400);
    }

    return prisma.$transaction(async (tx) => {
      const updatedCorrection = await tx.attendanceCorrection.update({
        where: { id: correctionId },
        data: {
          status: action as CorrectionStatus,
          reviewedById,
          reviewedAt: new Date(),
          rejectionReason: action === 'REJECTED' ? rejectionReason : null,
        },
      });

      if (action === 'APPROVED') {
        const beforeData = {
          status: correction.attendance.status,
          firstIn: correction.attendance.firstIn,
          lastOut: correction.attendance.lastOut,
        };

        const updatedAttendance = await tx.dailyAttendance.update({
          where: { id: correction.attendanceId },
          data: {
            status: correction.requestedStatus,
            firstIn: correction.requestedFirstIn || correction.attendance.firstIn,
            lastOut: correction.requestedLastOut || correction.attendance.lastOut,
            isRegularized: true,
            isFlaggedForReview: false,
            reviewReason: `Regularized via approved request: ${correction.reason}`,
          },
        });

        // Audit log with before/after values
        await logAudit({
          userId: reviewedById,
          employeeId: correction.employeeId,
          action: 'REGULARIZE_ATTENDANCE',
          entity: 'ATTENDANCE',
          entityId: updatedAttendance.id,
          beforeData,
          afterData: {
            status: updatedAttendance.status,
            firstIn: updatedAttendance.firstIn,
            lastOut: updatedAttendance.lastOut,
            reason: correction.reason,
          },
          ipAddress: clientMeta?.ipAddress,
          userAgent: clientMeta?.userAgent,
        });
      }

      return updatedCorrection;
    });
  }

  // Lock Attendance Period for Month Closing
  static async lockPeriod(monthStr: string, lockedById: string, notes?: string, branchId?: string) {
    // Check if any open corrections exist
    const pendingCorrections = await prisma.attendanceCorrection.count({
      where: {
        status: CorrectionStatus.PENDING,
        attendance: {
          date: {
            gte: new Date(`${monthStr}-01T00:00:00.000Z`),
            lte: new Date(`${monthStr}-31T23:59:59.999Z`),
          },
        },
      },
    });

    if (pendingCorrections > 0) {
      throw new AppError(
        `Cannot lock period: There are ${pendingCorrections} pending attendance correction requests that must be resolved first.`,
        400
      );
    }

    const existingPeriod = await prisma.attendancePeriod.findFirst({
      where: {
        month: monthStr,
        ...(branchId ? { branchId } : {}),
      },
    });

    if (existingPeriod) {
      return prisma.attendancePeriod.update({
        where: { id: existingPeriod.id },
        data: {
          isLocked: true,
          lockedAt: new Date(),
          lockedById,
          notes: notes || 'Monthly closing locked by School Admin.',
        },
      });
    } else {
      return prisma.attendancePeriod.create({
        data: {
          month: monthStr,
          branchId: branchId || null,
          isLocked: true,
          lockedAt: new Date(),
          lockedById,
          notes: notes || 'Monthly closing locked by School Admin.',
        },
      });
    }
  }

  // Record punch from Web Portal / Virtual Biometric Terminal
  static async recordWebPunch(params: {
    employeeId: string;
    userId: string;
    punchType: 'CHECK_IN' | 'CHECK_OUT';
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { employeeId, userId, punchType, ipAddress, userAgent } = params;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        deviceMaps: { include: { device: true } },
        shift: true,
        branch: true,
      },
    });

    if (!employee) throw new AppError('Employee profile not found.', 404);

    // Resolve or auto-establish device mapping
    let deviceMap = employee.deviceMaps[0];
    let deviceId = deviceMap?.deviceId;
    let deviceUserId = deviceMap?.deviceUserId;

    if (!deviceMap) {
      let device = await prisma.device.findFirst({
        where: { status: 'ONLINE' },
      });
      if (!device) {
        device = await prisma.device.findFirst();
      }
      if (!device) {
        device = await prisma.device.create({
          data: {
            deviceCode: 'BIO-GATE-01',
            name: 'Main Gate Biometric Terminal',
            brand: 'ZKTeco / Web Synced',
            location: 'Main School Gate',
            status: 'ONLINE',
          },
        });
      }

      const numericPart = employee.employeeId.replace(/\D/g, '') || '1001';
      deviceUserId = String(1000 + parseInt(numericPart, 10));

      deviceMap = await prisma.deviceEmployeeMap.create({
        data: {
          deviceId: device.id,
          employeeId: employee.id,
          deviceUserId,
          isActive: true,
        },
        include: { device: true },
      });
      deviceId = device.id;
    }

    const now = new Date();

    // Prevent duplicate punch within 30 seconds
    const recentPunch = await prisma.rawPunchEvent.findFirst({
      where: {
        deviceId,
        deviceUserId,
        punchTime: {
          gte: new Date(now.getTime() - 30 * 1000),
        },
      },
    });

    if (recentPunch) {
      throw new AppError('Duplicate punch detected: Please wait at least 30 seconds between consecutive punches.', 429);
    }

    // Insert into immutable raw punch ledger
    await prisma.rawPunchEvent.create({
      data: {
        deviceId,
        deviceUserId,
        punchTime: now,
        punchType: punchType === 'CHECK_OUT' ? PunchType.CHECK_OUT : PunchType.CHECK_IN,
        verifyType: VerifyType.MANUAL,
        syncStatus: SyncStatus.PROCESSED,
        processedAt: now,
        rawPayload: JSON.stringify({
          source: 'WEB_PORTAL',
          punchedByUserId: userId,
          employeeId: employee.id,
          ipAddress,
          userAgent,
        }),
      },
    });

    // Run Daily Attendance Processor to immediately calculate status & hours
    await AttendanceProcessor.processDailyAttendance(now, employee.branchId);

    // Return today's updated punch status and attendance record
    return this.getTodayPunchStatus(employee.id);
  }

  // Get Today's Live Punch Status & Shift Info for Portal
  static async getTodayPunchStatus(employeeId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        shift: true,
        deviceMaps: { include: { device: true } },
      },
    });

    if (!employee) throw new AppError('Employee profile not found.', 404);

    const defaultShift = await prisma.shift.findFirst({ where: { isDefault: true } });
    const shift = employee.shift || defaultShift;

    const istDate = toIST(new Date());
    const dayStart = startOfDay(istDate);
    const dayEnd = endOfDay(istDate);

    const dailyAttendance = await prisma.dailyAttendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: dayStart,
        },
      },
      include: {
        shift: true,
      },
    });

    const mappedUserIds = employee.deviceMaps.map((m) => m.deviceUserId);

    const punches = await prisma.rawPunchEvent.findMany({
      where: {
        deviceUserId: { in: mappedUserIds },
        punchTime: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        device: true,
      },
      orderBy: { punchTime: 'asc' },
    });

    return {
      employee: {
        id: employee.id,
        name: employee.name,
        employeeId: employee.employeeId,
        deviceUserId: employee.deviceMaps[0]?.deviceUserId || null,
      },
      shift: shift
        ? {
            id: shift.id,
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            gracePeriodMinutes: shift.gracePeriodMinutes,
            halfDayMinimumMinutes: shift.halfDayMinimumMinutes,
            fullDayMinimumMinutes: shift.fullDayMinimumMinutes,
          }
        : null,
      attendance: dailyAttendance,
      punches: punches.map((p) => {
        let source = 'BIOMETRIC_DEVICE';
        try {
          if (p.rawPayload) {
            const parsed = JSON.parse(p.rawPayload);
            if (parsed.source) source = parsed.source;
          }
        } catch (_) {}

        return {
          id: p.id,
          punchTime: p.punchTime,
          punchType: p.punchType,
          verifyType: p.verifyType,
          source,
          deviceCode: p.device?.deviceCode || 'UNKNOWN',
          deviceName: p.device?.name || 'Biometric Machine',
        };
      }),
      serverTime: new Date().toISOString(),
    };
  }
}

