import { z } from 'zod';
import { EmployeeStatus, SalaryBasis } from '@prisma/client';

export const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email required').optional().nullable(),
    mobile: z.string().min(10, 'Mobile must be at least 10 digits'),
    departmentId: z.string().optional().nullable(),
    designation: z.string().min(2, 'Designation is required'),
    branchId: z.string().min(1, 'Branch ID is required'),
    shiftId: z.string().optional().nullable(),
    joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Joining date must be YYYY-MM-DD'),
    salaryBasis: z.nativeEnum(SalaryBasis).optional().default(SalaryBasis.CALENDAR_DAYS),
    panNumber: z.string().optional().nullable(),
    bankAccountNumber: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    bankIfsc: z.string().optional().nullable(),

    // Initial Salary Structure
    basicSalary: z.number().nonnegative(),
    hra: z.number().nonnegative().optional().default(0),
    da: z.number().nonnegative().optional().default(0),
    specialAllowance: z.number().nonnegative().optional().default(0),
    conveyance: z.number().nonnegative().optional().default(0),
    otherAllowances: z.number().nonnegative().optional().default(0),

    // Academic & Teaching Assignments
    subject: z.string().optional().nullable(),
    assignedClass: z.string().optional().nullable(),

    // Biometric device mapping (optional during onboarding)
    deviceId: z.string().optional().nullable(),
    deviceUserId: z.string().optional().nullable(),

    // Also auto-create user login if password provided
    createLogin: z.boolean().optional().default(true),
    loginPassword: z.string().min(6).optional().default('Teacher@12345'),
  }),
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional().nullable(),
    mobile: z.string().min(10).optional(),
    departmentId: z.string().optional().nullable(),
    designation: z.string().optional(),
    branchId: z.string().optional(),
    shiftId: z.string().optional().nullable(),
    leavingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    status: z.nativeEnum(EmployeeStatus).optional(),
    salaryBasis: z.nativeEnum(SalaryBasis).optional(),
    panNumber: z.string().optional().nullable(),
    bankAccountNumber: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    bankIfsc: z.string().optional().nullable(),
  }),
});

export const mapDeviceSchema = z.object({
  body: z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
    deviceUserId: z.string().min(1, 'Biometric device user/enrolment ID is required'),
  }),
});

