import { Request, Response, NextFunction } from 'express';
import { PayslipsService } from './payslips.service.js';
import { sendSuccess } from '../../utils/response.js';

export class PayslipsController {
  static async getTeacherSlips(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.user!.employeeId!;
      const slips = await PayslipsService.getTeacherPayslips(employeeId);
      return sendSuccess(res, 'Published payslips fetched.', slips);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payslip = await PayslipsService.getPayslipById(id, req.user);
      return sendSuccess(res, 'Payslip details fetched.', payslip);
    } catch (error) {
      return next(error);
    }
  }

  static async downloadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pdfStream = await PayslipsService.generatePdf(id, req.user);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="payslip-${id}.pdf"`);

      pdfStream.pipe(res);
    } catch (error) {
      return next(error);
    }
  }
}

