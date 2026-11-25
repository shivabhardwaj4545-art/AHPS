import { Request, Response, NextFunction } from 'express';
import { PayrollService } from './payroll.service.js';
import { sendSuccess } from '../../utils/response.js';
import { extractClientMeta } from '../../middlewares/audit.js';

export class PayrollController {
  // Preview
  static async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const { month, branchId } = req.body;
      const result = await PayrollService.calculatePayrollPreview(month, branchId);
      return sendSuccess(res, 'Payroll preview calculated successfully.', result);
    } catch (error) {
      return next(error);
    }
  }

  // Generate / Recalculate Draft
  static async generateDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const { month, branchId } = req.body;
      const run = await PayrollService.generateDraftPayroll(month, branchId);
      return sendSuccess(res, `Draft payroll created for ${month}.`, run, 201);
    } catch (error) {
      return next(error);
    }
  }

  // Get Run by Month
  static async getRun(req: Request, res: Response, next: NextFunction) {
    try {
      const { month } = req.params;
      const branchId = req.query.branchId as string;
      const run = await PayrollService.getPayrollRun(month, branchId);
      return sendSuccess(res, 'Payroll run details fetched.', run);
    } catch (error) {
      return next(error);
    }
  }

  // Review
  static async review(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const run = await PayrollService.markReviewed(id);
      return sendSuccess(res, 'Payroll marked as REVIEWED.', run);
    } catch (error) {
      return next(error);
    }
  }

  // Approve
  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const meta = extractClientMeta(req);
      const run = await PayrollService.approvePayroll(id, req.user!.id, meta);
      return sendSuccess(res, 'Payroll approved and locked successfully.', run);
    } catch (error) {
      return next(error);
    }
  }

  // Mark Paid
  static async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const meta = extractClientMeta(req);
      const run = await PayrollService.markPaid(id, req.user!.id, meta);
      return sendSuccess(res, 'Payroll marked as PAID and payslips published.', run);
    } catch (error) {
      return next(error);
    }
  }

  // Hold / Release salary
  static async toggleHold(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const { isHeld, reason } = req.body;
      const item = await PayrollService.toggleSalaryHold(itemId, Boolean(isHeld), reason);
      return sendSuccess(res, `Salary hold updated: ${isHeld ? 'HELD' : 'RELEASED'}`, item);
    } catch (error) {
      return next(error);
    }
  }
}

