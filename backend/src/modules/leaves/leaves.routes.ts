import { Router } from 'express';
import { LeavesController } from './leaves.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/types', LeavesController.listTypes);
router.get('/balances/:employeeId', LeavesController.getBalances);
router.get('/requests', LeavesController.listRequests);
router.post('/requests', LeavesController.apply);

// Approvals: Admin & Super Admin only
router.patch(
  '/requests/:id/decision',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  LeavesController.review
);

export default router;

