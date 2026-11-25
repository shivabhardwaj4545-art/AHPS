import { Router } from 'express';
import { HolidaysController } from './holidays.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', HolidaysController.listHolidays);
router.post('/', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), HolidaysController.createHoliday);
router.delete('/:id', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), HolidaysController.deleteHoliday);

router.get('/weekly-offs', HolidaysController.listWeeklyOffs);
router.post('/weekly-offs', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), HolidaysController.updateWeeklyOffs);

export default router;

