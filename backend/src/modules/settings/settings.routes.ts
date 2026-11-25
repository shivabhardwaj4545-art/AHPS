import { Router } from 'express';
import { SettingsController } from './settings.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Settings can be read by Super Admin and Admin
router.get('/', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), SettingsController.list);

// Settings modified by Admin
router.post('/', requireRole(UserRole.ADMIN), SettingsController.update);

export default router;

