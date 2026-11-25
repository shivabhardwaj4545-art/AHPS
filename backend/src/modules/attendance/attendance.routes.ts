import { Router } from 'express';
import { AttendanceController } from './attendance.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Query Attendance
router.get('/today', AttendanceController.getToday);
router.post('/punch', AttendanceController.punch);
router.get('/daily', AttendanceController.getDaily);
router.get('/monthly', AttendanceController.getMonthly);

// Trigger Processing
router.post(
  '/process',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AttendanceController.processDaily
);

// Regularization Requests
router.post('/:id/correction', AttendanceController.requestCorrection);
router.patch(
  '/corrections/:correctionId/decision',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AttendanceController.reviewCorrection
);

// Lock Monthly Period
router.post(
  '/periods/:month/lock',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AttendanceController.lockPeriod
);

export default router;

