import { Request, Response, NextFunction } from 'express';
import { HolidaysService } from './holidays.service.js';
import { sendSuccess } from '../../utils/response.js';

export class HolidaysController {
  static async listHolidays(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const branchId = req.query.branchId as string;
      const holidays = await HolidaysService.listHolidays(year, branchId);
      return sendSuccess(res, 'Holidays fetched successfully.', holidays);
    } catch (error) {
      return next(error);
    }
  }

  static async createHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      const holiday = await HolidaysService.createHoliday(req.body);
      return sendSuccess(res, 'Holiday created successfully.', holiday, 201);
    } catch (error) {
      return next(error);
    }
  }

  static async deleteHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      await HolidaysService.deleteHoliday(req.params.id);
      return sendSuccess(res, 'Holiday removed successfully.');
    } catch (error) {
      return next(error);
    }
  }

  static async listWeeklyOffs(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = req.query.branchId as string;
      const offs = await HolidaysService.listWeeklyOffs(branchId);
      return sendSuccess(res, 'Weekly offs fetched.', offs);
    } catch (error) {
      return next(error);
    }
  }

  static async updateWeeklyOffs(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId, days } = req.body;
      const result = await HolidaysService.updateWeeklyOffs(branchId, days);
      return sendSuccess(res, 'Weekly offs updated successfully.', result);
    } catch (error) {
      return next(error);
    }
  }
}

