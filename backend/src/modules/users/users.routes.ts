import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validate } from '../../middlewares/validate.js';
import { createUserSchema, updateUserSchema } from './users.validation.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Super Admin and Admin can manage system user logins and change teacher credentials
router.use(authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.get('/', UsersController.list);
router.get('/by-employee/:employeeId', UsersController.getByEmployeeId);
router.post('/', validate(createUserSchema), UsersController.create);
router.patch('/:id', validate(updateUserSchema), UsersController.update);
router.patch('/:id/toggle-status', UsersController.toggleStatus);

export default router;
