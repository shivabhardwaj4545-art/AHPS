import PDFDocument from 'pdfkit';
import { prisma } from '../../config/db.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { decrypt, maskSensitive } from '../../utils/crypto.js';
import { UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export class PayslipsService {
  static async getTeacherPayslips(employeeId: string) {
    return prisma.payslip.findMany({
      where: {
        employeeId,
        isPublished: true,
      },
      include: {
        payrollItem: true,
      },
      orderBy: { month: 'desc' },
    });
  }

  static async getPayslipById(id: string, currentUser: any) {
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        payrollItem: {
          include: {
            payrollRun: true,
          },
        },
        employee: {
          include: {
            department: true,
            branch: true,
          },
        },
      },
    });

    if (!payslip) throw new AppError('Payslip not found.', 404);

    // If teacher, ensure it belongs to them and is published
    if (currentUser.role === UserRole.TEACHER) {
      if (payslip.employeeId !== currentUser.employeeId) {
        throw new AppError('Access denied: You cannot view another teacher payslip.', 403);
      }
      if (!payslip.isPublished) {
        throw new AppError('This payslip has not yet been published by HR.', 403);
      }
    }

    return payslip;
  }

  /**
   * Generates a PDF stream using PDFKit
   */
  static async generatePdf(payslipId: string, currentUser: any): Promise<PDFKit.PDFDocument> {
    const payslip = await this.getPayslipById(payslipId, currentUser);
    const item = payslip.payrollItem;
    const emp = payslip.employee;

    // Fetch school name from settings
    const schoolNameSetting = await prisma.setting.findUnique({ where: { key: 'INSTITUTION_NAME' } });
    const schoolName = schoolNameSetting?.value || 'Achievers Home Public School';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // HEADER
    doc.fillColor('#1e3a8a').fontSize(18).text(schoolName.toUpperCase(), { align: 'center' });
    doc.fillColor('#4b5563').fontSize(10).text(emp.branch?.address || 'Affiliated to CBSE, Sector 14, Delhi NCR', { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor('#111827').fontSize(13).text(`SALARY PAYSLIP - ${payslip.month}`, { align: 'center', underline: true });
    doc.moveDown(1);

    // EMPLOYEE & SLIP INFO TABLE
    const startY = doc.y;
    doc.rect(40, startY, 515, 75).strokeColor('#e5e7eb').stroke();

    doc.fontSize(9).fillColor('#374151');
    doc.text(`Employee ID: ${emp.employeeId}`, 50, startY + 10);
    doc.text(`Name: ${emp.name}`, 50, startY + 25);
    doc.text(`Designation: ${emp.designation}`, 50, startY + 40);
    doc.text(`Department: ${emp.department?.name || 'Academics'}`, 50, startY + 55);

    doc.text(`Payslip No: ${payslip.slipNumber}`, 300, startY + 10);
    doc.text(`Bank Name: ${emp.bankName || 'SBI'}`, 300, startY + 25);
    doc.text(`Account No: ${maskSensitive(decrypt(emp.bankAccountNumber))}`, 300, startY + 40);
    doc.text(`PAN: ${maskSensitive(decrypt(emp.panNumber))}`, 300, startY + 55);

    doc.y = startY + 85;
    doc.moveDown(0.5);

    // ATTENDANCE SUMMARY
    doc.rect(40, doc.y, 515, 40).fillAndStroke('#f9fafb', '#e5e7eb');
    const attY = doc.y + 10;
    doc.fillColor('#1f2937').fontSize(9);
    doc.text(`Days in Month: ${item.totalDaysInMonth}`, 50, attY);
    doc.text(`Payable Days: ${item.payableDays}`, 155, attY);
    doc.text(`Present: ${item.presentDays}`, 255, attY);
    doc.text(`Paid Leaves: ${item.paidLeaveDays}`, 330, attY);
    doc.text(`Unpaid/Absent: ${item.unpaidLeaveDays}`, 425, attY);

    doc.y = attY + 30;
    doc.moveDown(1);

    // SALARY BREAKDOWN (TWO COLUMNS: EARNINGS & DEDUCTIONS)
    const tableTop = doc.y;
    doc.rect(40, tableTop, 255, 140).strokeColor('#e5e7eb').stroke(); // Left box
    doc.rect(300, tableTop, 255, 140).strokeColor('#e5e7eb').stroke(); // Right box

    // Earnings Header
    doc.rect(40, tableTop, 255, 20).fill('#f3f4f6');
    doc.fillColor('#111827').fontSize(10).text('EARNINGS', 50, tableTop + 5);
    doc.text('AMOUNT (INR)', 220, tableTop + 5);

    // Earnings Lines
    let eY = tableTop + 25;
    doc.fontSize(9).fillColor('#374151');
    doc.text('Basic Salary', 50, eY);
    doc.text(`₹ ${item.basicSalary.toLocaleString('en-IN')}`, 220, eY);

    eY += 16;
    const hraAmount = Math.max(0, item.grossSalary - item.basicSalary);
    doc.text('HRA & Allowances', 50, eY);
    doc.text(`₹ ${hraAmount.toLocaleString('en-IN')}`, 220, eY);

    if (item.bonusArrears > 0) {
      eY += 16;
      doc.text('Bonus / Arrears', 50, eY);
      doc.text(`₹ ${item.bonusArrears.toLocaleString('en-IN')}`, 220, eY);
    }

    if (item.additions > 0) {
      eY += 16;
      doc.text('Other Additions', 50, eY);
      doc.text(`₹ ${item.additions.toLocaleString('en-IN')}`, 220, eY);
    }

    // Deductions Header
    doc.rect(300, tableTop, 255, 20).fill('#f3f4f6');
    doc.fillColor('#111827').fontSize(10).text('DEDUCTIONS', 310, tableTop + 5);
    doc.text('AMOUNT (INR)', 470, tableTop + 5);

    // Deductions Lines
    let dY = tableTop + 25;
    doc.fontSize(9).fillColor('#374151');
    doc.text('Unpaid Leave/Absence', 310, dY);
    doc.text(`₹ ${item.unpaidLeaveDeductions.toLocaleString('en-IN')}`, 470, dY);

    if (item.statutoryDeductions > 0) {
      dY += 16;
      doc.text('PF / Statutory', 310, dY);
      doc.text(`₹ ${item.statutoryDeductions.toLocaleString('en-IN')}`, 470, dY);
    }

    if (item.advanceDeductions > 0) {
      dY += 16;
      doc.text('Advance EMI', 310, dY);
      doc.text(`₹ ${item.advanceDeductions.toLocaleString('en-IN')}`, 470, dY);
    }

    if (item.otherDeductions > 0) {
      dY += 16;
      doc.text('Other Deductions', 310, dY);
      doc.text(`₹ ${item.otherDeductions.toLocaleString('en-IN')}`, 470, dY);
    }

    // NET SALARY HIGHLIGHT BOX
    doc.y = tableTop + 155;
    doc.rect(40, doc.y, 515, 35).fillAndStroke('#ecfdf5', '#10b981');
    doc.fillColor('#065f46').fontSize(12).text(
      `NET SALARY PAYABLE: ₹ ${item.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      50,
      doc.y + 11
    );

    // FOOTER NOTE
    doc.y = doc.y + 60;
    doc.fillColor('#9ca3af').fontSize(8).text(
      'Note: This is a system-generated electronic payslip. No physical signature required.',
      40,
      doc.y,
      { align: 'center', width: 515 }
    );

    doc.end();

    // Track downloaded date
    await prisma.payslip.update({
      where: { id: payslipId },
      data: { downloadedAt: new Date() },
    });

    return doc;
  }
}

