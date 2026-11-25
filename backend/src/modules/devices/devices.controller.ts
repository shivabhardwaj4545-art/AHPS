import { Request, Response, NextFunction } from 'express';
import { DevicesService } from './devices.service.js';
import { sendSuccess } from '../../utils/response.js';

export class DevicesController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const devices = await DevicesService.listDevices();
      return sendSuccess(res, 'Devices fetched successfully.', devices);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const device = await DevicesService.getDeviceById(req.params.id);
      return sendSuccess(res, 'Device details fetched.', device);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const device = await DevicesService.createDevice(req.body);
      return sendSuccess(res, 'Device registered successfully.', device, 201);
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const device = await DevicesService.updateDevice(req.params.id, req.body);
      return sendSuccess(res, 'Device updated successfully.', device);
    } catch (error) {
      return next(error);
    }
  }

  static async sync(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DevicesService.triggerSync(req.params.id);
      return sendSuccess(res, 'Device sync operation finished.', result);
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await DevicesService.deleteDevice(req.params.id);
      return sendSuccess(res, 'Device deleted successfully.');
    } catch (error) {
      return next(error);
    }
  }

  static async logs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await DevicesService.getDeviceLogs(req.params.id);
      return sendSuccess(res, 'Device logs fetched.', logs);
    } catch (error) {
      return next(error);
    }
  }
}

