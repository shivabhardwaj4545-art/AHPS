import { Router } from 'express';
import { PayslipsController } from './payslips.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// Teacher Portal endpoint: list own payslips
router.get('/my-payslips', PayslipsController.getTeacherSlips);

// View payslip details
router.get('/:id', PayslipsController.getById);

// Download PDF payslip
router.get('/:id/pdf', PayslipsController.downloadPdf);

export default router;

