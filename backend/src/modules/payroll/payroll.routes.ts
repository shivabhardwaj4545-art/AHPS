import { Router } from 'express';
import { PayrollController } from './payroll.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.post('/preview', PayrollController.preview);
router.post('/generate', PayrollController.generateDraft);
router.get('/runs/:month', PayrollController.getRun);
router.post('/:id/review', PayrollController.review);
router.post('/:id/approve', PayrollController.approve);
router.post('/:id/mark-paid', PayrollController.markPaid);
router.post('/items/:itemId/hold', PayrollController.toggleHold);

export default router;

