import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service.js';
import { sendSuccess } from '../../utils/response.js';

export class ReportsController {
  // Export Salary Register Excel
  static async exportPayrollExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const monthStr = (req.query.month as string) || new Date().toISOString().slice(0, 7);
      const branchId = req.query.branchId as string;

      const workbook = await ReportsService.generateSalaryRegisterWorkbook(monthStr, branchId);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="salary-register-${monthStr}.xlsx"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      return next(error);
    }
  }

  // Export Bank Transfer CSV
  static async exportBankCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const monthStr = (req.query.month as string) || new Date().toISOString().slice(0, 7);
      const branchId = req.query.branchId as string;

      const csvContent = await ReportsService.generateBankTransferCsv(monthStr, branchId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="bank-transfer-${monthStr}.csv"`);

      res.send(csvContent);
    } catch (error) {
      return next(error);
    }
  }

  // Late Arrival Report
  static async getLateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const monthStr = (req.query.month as string) || new Date().toISOString().slice(0, 7);
      const records = await ReportsService.getLateReport(monthStr);
      return sendSuccess(res, 'Late report data fetched.', records);
    } catch (error) {
      return next(error);
    }
  }

  // Absenteeism Report
  static async getAbsentReport(req: Request, res: Response, next: NextFunction) {
    try {
      const monthStr = (req.query.month as string) || new Date().toISOString().slice(0, 7);
      const records = await ReportsService.getAbsentReport(monthStr);
      return sendSuccess(res, 'Absent report data fetched.', records);
    } catch (error) {
      return next(error);
    }
  }
}

