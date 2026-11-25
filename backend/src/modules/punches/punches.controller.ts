import { Request, Response, NextFunction } from 'express';
import { PunchesService } from './punches.service.js';
import { prisma } from '../../config/db.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class PunchesController {
  // Push Webhook from Biometric Hardware
  static async receiveDeviceEvents(req: Request, res: Response, next: NextFunction) {
    try {
      // Hardware may identify itself by Device Code header, query param, or payload
      const deviceCode =
        (req.headers['x-device-code'] as string) ||
        (req.query.deviceCode as string) ||
        req.body?.deviceCode ||
        req.body?.SN ||
        'BIO-GATE-01'; // Default fallback

      const device = await prisma.device.findFirst({
        where: { deviceCode },
      });

      if (!device) {
        return sendError(res, `Unrecognized device code: ${deviceCode}`, undefined, 404);
      }

      // Check device secret if set
      if (device.secretToken) {
        const token = req.headers['x-device-token'] || req.query.token;
        if (token !== device.secretToken) {
          return sendError(res, 'Unauthorized device token.', undefined, 401);
        }
      }

      const result = await PunchesService.ingestPunches(device.id, req.body, req.headers);
      return sendSuccess(res, 'Biometric events processed successfully.', result, 200);
    } catch (error) {
      return next(error);
    }
  }

  // View Punch Events Log
  static async listEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const deviceId = req.query.deviceId as string;
      const deviceUserId = req.query.deviceUserId as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const result = await PunchesService.listPunchEvents({
        page,
        limit,
        deviceId,
        deviceUserId,
        startDate,
        endDate,
      });

      return sendSuccess(res, 'Raw punch events fetched.', result.punches, 200, result.meta);
    } catch (error) {
      return next(error);
    }
  }
}

