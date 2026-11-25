import { Router } from 'express';
import { PunchesController } from './punches.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Biometric Hardware Push Receiver: Unauthenticated or protected by device secret token
router.post('/device-events', PunchesController.receiveDeviceEvents);

// Raw Punch Logs Query: Authenticated Admin / Super Admin
router.get(
  '/punch-events',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  PunchesController.listEvents
);

export default router;

