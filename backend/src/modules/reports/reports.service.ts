import ExcelJS from 'exceljs';
import { prisma } from '../../config/db.js';
import { decrypt } from '../../utils/crypto.js';
import { AttendanceStatus } from '@prisma/client';

export class ReportsService {
  /**
   * Generates Excel Salary Register for a month
   */
  static async generateSalaryRegisterWorkbook(monthStr: string, branchId?: string) {
    const payrollRun = await prisma.payrollRun.findFirst({
      where: {
        month: monthStr,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        items: {
          include: {
            employee: {
              include: { department: true },
            },
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'School Attendance & Payroll System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`Salary Register ${monthStr}`);

    // Headers
    sheet.columns = [
      { header: 'Emp Code', key: 'code', width: 14 },
      { header: 'Teacher Name', key: 'name', width: 25 },
      { header: 'Department', key: 'dept', width: 18 },
      { header: 'Designation', key: 'desig', width: 22 },
      { header: 'Days in Month', key: 'totalDays', width: 14 },
      { header: 'Payable Days', key: 'payableDays', width: 14 },
      { header: 'Present', key: 'present', width: 10 },
      { header: 'Paid Leaves', key: 'paidLeave', width: 12 },
      { header: 'Unpaid/Absent', key: 'unpaid', width: 14 },
      { header: 'Basic (INR)', key: 'basic', width: 14 },
      { header: 'Gross Salary (INR)', key: 'gross', width: 18 },
      { header: 'Unpaid Deductions', key: 'unpaidDed', width: 18 },
      { header: 'Statutory Ded', key: 'statDed', width: 14 },
      { header: 'Other Ded / EMI', key: 'otherDed', width: 16 },
      { header: 'Bonus / Arrears', key: 'bonus', width: 16 },
      { header: 'Net Salary (INR)', key: 'net', width: 18 },
    ];

    // Style Header Row
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };

    if (payrollRun && payrollRun.items) {
      for (const item of payrollRun.items) {
        sheet.addRow({
          code: item.employee.employeeId,
          name: item.employee.name,
          dept: item.employee.department?.name || 'Academics',
          desig: item.employee.designation,
          totalDays: item.totalDaysInMonth,
          payableDays: item.payableDays,
          present: item.presentDays,
          paidLeave: item.paidLeaveDays,
          unpaid: item.unpaidLeaveDays,
          basic: item.basicSalary,
          gross: item.grossSalary,
          unpaidDed: item.unpaidLeaveDeductions,
          statDed: item.statutoryDeductions,
          otherDed: item.otherDeductions + item.advanceDeductions,
          bonus: item.bonusArrears + item.additions,
          net: item.netSalary,
        });
      }
    }

    return workbook;
  }

  /**
   * Generates Bank Transfer CSV for salary disbursement batch upload
   */
  static async generateBankTransferCsv(monthStr: string, branchId?: string): Promise<string> {
    const payrollRun = await prisma.payrollRun.findFirst({
      where: {
        month: monthStr,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        items: {
          include: { employee: true },
        },
      },
    });

    const rows = [
      ['Beneficiary Account Number', 'Beneficiary Name', 'Amount (INR)', 'IFSC Code', 'Bank Name', 'Narration'],
    ];

    if (payrollRun && payrollRun.items) {
      for (const item of payrollRun.items) {
        if (item.isHeld) continue; // Skip held salaries

        const accountNo = decrypt(item.employee.bankAccountNumber) || '';
        const ifsc = item.employee.bankIfsc || '';
        const bank = item.employee.bankName || 'Bank';

        rows.push([
          `"${accountNo}"`,
          `"${item.employee.name}"`,
          `${item.netSalary}`,
          `"${ifsc}"`,
          `"${bank}"`,
          `"Salary for ${monthStr} ${item.employee.employeeId}"`,
        ]);
      }
    }

    return rows.map((r) => r.join(',')).join('\n');
  }

  /**
   * Query Late Arrivals
   */
  static async getLateReport(monthStr: string) {
    const startDate = new Date(`${monthStr}-01T00:00:00.000Z`);
    const endDate = new Date(`${monthStr}-31T23:59:59.999Z`);

    return prisma.dailyAttendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: AttendanceStatus.LATE,
      },
      include: {
        employee: { select: { id: true, employeeId: true, name: true, designation: true } },
        shift: { select: { name: true, startTime: true } },
      },
      orderBy: { lateMinutes: 'desc' },
    });
  }

  /**
   * Query Absences
   */
  static async getAbsentReport(monthStr: string) {
    const startDate = new Date(`${monthStr}-01T00:00:00.000Z`);
    const endDate = new Date(`${monthStr}-31T23:59:59.999Z`);

    return prisma.dailyAttendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: { in: [AttendanceStatus.ABSENT, AttendanceStatus.MISSING_PUNCH] },
      },
      include: {
        employee: { select: { id: true, employeeId: true, name: true, designation: true } },
      },
      orderBy: { date: 'asc' },
    });
  }
}

