import { Router } from 'express';
import { DevicesController } from './devices.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.get('/', DevicesController.list);
router.post('/', DevicesController.create);
router.get('/:id', DevicesController.getById);
router.patch('/:id', DevicesController.update);
router.delete('/:id', DevicesController.delete);
router.post('/:id/sync', DevicesController.sync);
router.get('/:id/logs', DevicesController.logs);

export default router;

