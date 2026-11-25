import { Router } from 'express';
import { ShiftsController } from './shifts.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validate } from '../../middlewares/validate.js';
import { shiftSchema } from './shifts.validation.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Listing shifts is readable by all authenticated users
router.get('/', ShiftsController.list);
router.get('/:id', ShiftsController.getById);

// Create, update, delete reserved for Super Admin and Admin
router.post('/', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(shiftSchema), ShiftsController.create);
router.patch('/:id', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), ShiftsController.update);
router.delete('/:id', requireRole(UserRole.ADMIN), ShiftsController.delete);

export default router;

