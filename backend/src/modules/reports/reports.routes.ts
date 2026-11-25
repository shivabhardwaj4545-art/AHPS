import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.get('/payroll/excel', ReportsController.exportPayrollExcel);
router.get('/payroll/bank-transfer', ReportsController.exportBankCsv);
router.get('/late', ReportsController.getLateReport);
router.get('/absent', ReportsController.getAbsentReport);

export default router;

