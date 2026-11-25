import { Router } from 'express';
import { EmployeesController } from './employees.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole, enforceTeacherSelfOnly } from '../../middlewares/rbac.js';
import { validate } from '../../middlewares/validate.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  mapDeviceSchema,
} from './employees.validation.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// View list: Admin and Super Admin only
router.get('/', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), EmployeesController.list);

// Bulk import: Admin and Super Admin only
router.post('/bulk-import', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), EmployeesController.bulkImport);

// Register teacher: Admin and Super Admin only
router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createEmployeeSchema),
  EmployeesController.create
);

// View teacher profile: Admin or Teacher viewing their own record
router.get(
  '/:id',
  enforceTeacherSelfOnly((req) => req.params.id),
  EmployeesController.getById
);

// Update teacher: Admin and Super Admin only
router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateEmployeeSchema),
  EmployeesController.update
);

// Deactivate teacher: Admin and Super Admin only
router.post(
  '/:id/deactivate',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  EmployeesController.deactivate
);

// Map biometric device user ID: Admin and Super Admin only
router.post(
  '/:id/map-device',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(mapDeviceSchema),
  EmployeesController.mapDevice
);

export default router;

