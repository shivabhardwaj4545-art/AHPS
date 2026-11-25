import { Request, Response, NextFunction } from 'express';
import { ShiftsService } from './shifts.service.js';
import { sendSuccess } from '../../utils/response.js';

export class ShiftsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const shifts = await ShiftsService.listShifts();
      return sendSuccess(res, 'Shifts fetched successfully.', shifts);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const shift = await ShiftsService.getShiftById(req.params.id);
      return sendSuccess(res, 'Shift details fetched.', shift);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const shift = await ShiftsService.createShift(req.body);
      return sendSuccess(res, 'Shift created successfully.', shift, 201);
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const shift = await ShiftsService.updateShift(req.params.id, req.body);
      return sendSuccess(res, 'Shift updated successfully.', shift);
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ShiftsService.deleteShift(req.params.id);
      return sendSuccess(res, 'Shift deleted successfully.');
    } catch (error) {
      return next(error);
    }
  }
}

