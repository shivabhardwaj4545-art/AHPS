import { prisma } from '../../config/db.js';
import { getMonthDateRange, getAllDaysInMonth, formatDateOnly } from '../../utils/date.js';
import { generatePayslipNumber } from '../../utils/idGenerator.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { AttendanceStatus, EmployeeStatus, PayrollStatus, SalaryBasis } from '@prisma/client';
import { logAudit } from '../../middlewares/audit.js';

export interface PayrollCalculationInput {
  employeeId: string;
  month: string; // "YYYY-MM"
  branchId?: string;
}

export class PayrollService {
  /**
   * Preview or Calculate monthly payroll for all eligible employees in a branch
   */
  static async calculatePayrollPreview(monthStr: string, branchId?: string) {
    const { startDate, endDate, daysInMonth } = getMonthDateRange(monthStr);

    // Fetch settings for payroll basis & statutory toggle
    const basisSetting = await prisma.setting.findUnique({ where: { key: 'PAYROLL_CALCULATION_BASIS' } });
    const globalBasis = (basisSetting?.value as SalaryBasis) || SalaryBasis.CALENDAR_DAYS;

    const statutorySetting = await prisma.setting.findUnique({ where: { key: 'STATUTORY_DEDUCTIONS_ENABLED' } });
    const statutoryEnabled = statutorySetting?.value === 'true';

    // Fetch all active employees who joined on or before this month's end and haven't left before this month's start
    const employees = await prisma.employee.findMany({
      where: {
        deletedAt: null,
        status: { in: [EmployeeStatus.ACTIVE, EmployeeStatus.SUSPENDED] },
        joiningDate: { lte: endDate },
        OR: [{ leavingDate: null }, { leavingDate: { gte: startDate } }],
        ...(branchId ? { branchId } : {}),
      },
      include: {
        salaryStructures: {
          where: { isActive: true },
          take: 1,
        },
        dailyAttendance: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        salaryComponents: {
          where: {
            effectiveMonth: monthStr,
            isSettled: false,
          },
        },
      },
    });

    const items: any[] = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const emp of employees) {
      const activeSalary = emp.salaryStructures[0];
      if (!activeSalary) continue;

      const basic = activeSalary.basicSalary;
      const grossSalary = activeSalary.grossSalary;

      // Determine Divisor
      let divisor = daysInMonth;
      const salaryBasis = emp.salaryBasis || globalBasis;
      if (salaryBasis === SalaryBasis.FIXED_30) {
        divisor = 30;
      } else if (salaryBasis === SalaryBasis.WORKING_DAYS) {
        // Count non-weekly-off days in month
        divisor = 26; // Standard 26 working days divisor
      }

      const perDaySalary = grossSalary / divisor;

      // Attendance Metrics
      let presentCount = 0;
      let lateCount = 0;
      let halfDayCount = 0;
      let absentCount = 0;
      let paidLeaveCount = 0;
      let holidayCount = 0;
      let weeklyOffCount = 0;
      let missingPunchCount = 0;

      for (const att of emp.dailyAttendance) {
        switch (att.status) {
          case AttendanceStatus.PRESENT:
            presentCount++;
            break;
          case AttendanceStatus.LATE:
            lateCount++;
            presentCount++;
            break;
          case AttendanceStatus.HALF_DAY:
            halfDayCount++;
            break;
          case AttendanceStatus.ABSENT:
            absentCount++;
            break;
          case AttendanceStatus.ON_LEAVE:
            paidLeaveCount++;
            break;
          case AttendanceStatus.HOLIDAY:
            holidayCount++;
            break;
          case AttendanceStatus.WEEKLY_OFF:
            weeklyOffCount++;
            break;
          case AttendanceStatus.MISSING_PUNCH:
            missingPunchCount++;
            absentCount++; // Unresolved missing punches treated as absent until regularized
            break;
        }
      }

      // Mid-month joining/leaving proration calculation
      let prorationUnpaidDays = 0;
      if (emp.joiningDate > startDate) {
        // Teacher joined after 1st of month: calculate calendar days prior to joining
        const diffMs = emp.joiningDate.getTime() - startDate.getTime();
        prorationUnpaidDays += Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }
      if (emp.leavingDate && emp.leavingDate < endDate) {
        // Teacher left before end of month
        const diffMs = endDate.getTime() - emp.leavingDate.getTime();
        prorationUnpaidDays += Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      // Unpaid days = absent count + half day penalty (0.5 * halfDays) + proration
      const totalUnpaidDays = absentCount + halfDayCount * 0.5 + prorationUnpaidDays;
      const payableDays = Math.max(0, daysInMonth - totalUnpaidDays);

      const unpaidLeaveDeductions = Math.round(totalUnpaidDays * perDaySalary * 100) / 100;

      // Optional Statutory Deductions (PF 12% of basic if enabled, PT, etc.)
      let statutoryDeductions = 0;
      if (statutoryEnabled) {
        const pf = Math.round(basic * 0.12 * 100) / 100;
        statutoryDeductions += pf;
      }

      // Dynamic Salary Components
      let additions = 0;
      let otherDeductions = 0;
      let advanceDeductions = 0;
      let bonusArrears = 0;

      for (const comp of emp.salaryComponents) {
        if (comp.componentType === 'ADDITION') additions += comp.amount;
        else if (comp.componentType === 'BONUS' || comp.componentType === 'ARREARS') bonusArrears += comp.amount;
        else if (comp.componentType === 'ADVANCE_EMI') advanceDeductions += comp.amount;
        else if (comp.componentType === 'DEDUCTION') otherDeductions += comp.amount;
      }

      const totalItemDeductions = unpaidLeaveDeductions + statutoryDeductions + otherDeductions + advanceDeductions;
      const totalItemAdditions = additions + bonusArrears;
      const netSalary = Math.max(0, Math.round((grossSalary - totalItemDeductions + totalItemAdditions) * 100) / 100);

      items.push({
        employeeId: emp.id,
        employeeName: emp.name,
        employeeCode: emp.employeeId,
        designation: emp.designation,
        totalDaysInMonth: daysInMonth,
        payableDays,
        presentDays: presentCount,
        paidLeaveDays: paidLeaveCount,
        unpaidLeaveDays: totalUnpaidDays,
        weeklyOffDays: weeklyOffCount,
        holidayDays: holidayCount,
        lateDays: lateCount,
        halfDays: halfDayCount,
        basicSalary: basic,
        grossSalary,
        unpaidLeaveDeductions,
        statutoryDeductions,
        otherDeductions,
        additions,
        advanceDeductions,
        bonusArrears,
        netSalary,
        isHeld: false,
      });

      totalGross += grossSalary;
      totalDeductions += totalItemDeductions;
      totalNet += netSalary;
    }

    return {
      month: monthStr,
      totalEmployees: items.length,
      totalGross: Math.round(totalGross * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      items,
    };
  }

  // Generate or Update Draft Payroll Run
  static async generateDraftPayroll(monthStr: string, branchId?: string) {
    // 1. Check if an approved or paid payroll run already exists
    const existing = await prisma.payrollRun.findFirst({
      where: {
        month: monthStr,
        ...(branchId ? { branchId } : {}),
      },
    });

    if (existing && (existing.status === PayrollStatus.APPROVED || existing.status === PayrollStatus.PAID)) {
      throw new AppError(
        `Payroll for ${monthStr} is already ${existing.status} and locked. Modifying approved payroll requires an authorized revision.`,
        400
      );
    }

    const preview = await this.calculatePayrollPreview(monthStr, branchId);

    return prisma.$transaction(async (tx) => {
      let payrollRun;
      if (existing) {
        payrollRun = await tx.payrollRun.update({
          where: { id: existing.id },
          data: {
            status: PayrollStatus.DRAFT,
            totalGross: preview.totalGross,
            totalDeductions: preview.totalDeductions,
            totalNet: preview.totalNet,
            totalEmployees: preview.totalEmployees,
            isLocked: false,
          },
        });
      } else {
        payrollRun = await tx.payrollRun.create({
          data: {
            month: monthStr,
            branchId: branchId || null,
            status: PayrollStatus.DRAFT,
            totalGross: preview.totalGross,
            totalDeductions: preview.totalDeductions,
            totalNet: preview.totalNet,
            totalEmployees: preview.totalEmployees,
            isLocked: false,
          },
        });
      }

      // Clear existing draft items
      await tx.payrollItem.deleteMany({
        where: { payrollRunId: payrollRun.id },
      });

      // Insert new payroll items
      for (const item of preview.items) {
        await tx.payrollItem.create({
          data: {
            payrollRunId: payrollRun.id,
            employeeId: item.employeeId,
            totalDaysInMonth: item.totalDaysInMonth,
            payableDays: item.payableDays,
            presentDays: item.presentDays,
            paidLeaveDays: item.paidLeaveDays,
            unpaidLeaveDays: item.unpaidLeaveDays,
            weeklyOffDays: item.weeklyOffDays,
            holidayDays: item.holidayDays,
            lateDays: item.lateDays,
            halfDays: item.halfDays,
            basicSalary: item.basicSalary,
            grossSalary: item.grossSalary,
            unpaidLeaveDeductions: item.unpaidLeaveDeductions,
            statutoryDeductions: item.statutoryDeductions,
            otherDeductions: item.otherDeductions,
            additions: item.additions,
            advanceDeductions: item.advanceDeductions,
            bonusArrears: item.bonusArrears,
            netSalary: item.netSalary,
            isHeld: item.isHeld,
          },
        });
      }

      return payrollRun;
    });
  }

  // Get Full Payroll Run by Month
  static async getPayrollRun(monthStr: string, branchId?: string) {
    return prisma.payrollRun.findFirst({
      where: {
        month: monthStr,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        items: {
          include: {
            employee: {
              select: {
                id: true,
                employeeId: true,
                name: true,
                designation: true,
                bankAccountNumber: true,
                bankName: true,
                bankIfsc: true,
              },
            },
            payslip: true,
          },
        },
      },
    });
  }

  // State Transition: Review Payroll
  static async markReviewed(payrollRunId: string) {
    const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) throw new AppError('Payroll run not found.', 404);
    if (run.isLocked) throw new AppError('Locked payroll cannot be changed.', 400);

    return prisma.payrollRun.update({
      where: { id: payrollRunId },
      data: { status: PayrollStatus.REVIEWED },
    });
  }

  // State Transition: Approve Payroll (Locks payroll)
  static async approvePayroll(payrollRunId: string, approverId: string, clientMeta?: any) {
    const run = await prisma.payrollRun.findUnique({
      where: { id: payrollRunId },
      include: { items: true },
    });
    if (!run) throw new AppError('Payroll run not found.', 404);

    return prisma.$transaction(async (tx) => {
      const approvedRun = await tx.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status: PayrollStatus.APPROVED,
          isLocked: true,
          approvedAt: new Date(),
          approvedById: approverId,
        },
      });

      // Generate Payslip records for each item
      for (const item of run.items) {
        const emp = await tx.employee.findUnique({ where: { id: item.employeeId } });
        if (!emp) continue;

        const slipNumber = generatePayslipNumber(run.month, emp.employeeId);

        await tx.payslip.upsert({
          where: { payrollItemId: item.id },
          update: { slipNumber },
          create: {
            payrollItemId: item.id,
            employeeId: item.employeeId,
            month: run.month,
            slipNumber,
            isPublished: false,
          },
        });
      }

      await logAudit({
        userId: approverId,
        action: 'APPROVE_PAYROLL',
        entity: 'PAYROLL',
        entityId: payrollRunId,
        afterData: { month: run.month, totalNet: run.totalNet, totalEmployees: run.totalEmployees },
        ipAddress: clientMeta?.ipAddress,
        userAgent: clientMeta?.userAgent,
      });

      return approvedRun;
    });
  }

  // State Transition: Mark Paid & Publish Payslips
  static async markPaid(payrollRunId: string, payerId: string, clientMeta?: any) {
    const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) throw new AppError('Payroll run not found.', 404);

    return prisma.$transaction(async (tx) => {
      const paidRun = await tx.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status: PayrollStatus.PAID,
          paidAt: new Date(),
          paidById: payerId,
        },
      });

      // Publish all payslips in this run
      await tx.payslip.updateMany({
        where: { payrollItem: { payrollRunId } },
        data: {
          isPublished: true,
          publishedAt: new Date(),
        },
      });

      await logAudit({
        userId: payerId,
        action: 'MARK_PAID_PAYROLL',
        entity: 'PAYROLL',
        entityId: payrollRunId,
        afterData: { month: run.month, paidAt: new Date() },
        ipAddress: clientMeta?.ipAddress,
        userAgent: clientMeta?.userAgent,
      });

      return paidRun;
    });
  }

  // Toggle Salary Hold for an employee
  static async toggleSalaryHold(payrollItemId: string, isHeld: boolean, reason?: string) {
    const item = await prisma.payrollItem.findUnique({
      where: { id: payrollItemId },
      include: { payrollRun: true },
    });

    if (!item) throw new AppError('Payroll item not found.', 404);
    if (item.payrollRun.isLocked && item.payrollRun.status === PayrollStatus.PAID) {
      throw new AppError('Cannot alter payment status of an already disbursed payroll run.', 400);
    }

    return prisma.payrollItem.update({
      where: { id: payrollItemId },
      data: {
        isHeld,
        holdReason: isHeld ? reason : null,
      },
    });
  }
}

