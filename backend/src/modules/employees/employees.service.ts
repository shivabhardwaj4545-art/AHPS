import { prisma } from '../../config/db.js';
import { generateNextEmployeeId } from '../../utils/idGenerator.js';
import { encrypt, decrypt, maskSensitive } from '../../utils/crypto.js';
import { AuthService } from '../auth/auth.service.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { EmployeeStatus, SalaryBasis, UserRole } from '@prisma/client';

export class EmployeesService {
  static async listEmployees(params: {
    page?: number;
    limit?: number;
    search?: string;
    branchId?: string;
    departmentId?: string;
    status?: EmployeeStatus;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.branchId) where.branchId = params.branchId;
    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { employeeId: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { mobile: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          branch: true,
          shift: true,
          salaryStructures: {
            where: { isActive: true },
            take: 1,
          },
          deviceMaps: {
            include: { device: true },
          },
        },
        orderBy: { employeeId: 'asc' },
      }),
      prisma.employee.count({ where }),
    ]);

    // Mask sensitive details in list
    const sanitized = employees.map((emp) => ({
      ...emp,
      panNumber: maskSensitive(decrypt(emp.panNumber)),
      bankAccountNumber: maskSensitive(decrypt(emp.bankAccountNumber)),
      currentSalary: emp.salaryStructures[0]?.grossSalary || 0,
    }));

    return {
      employees: sanitized,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getEmployeeById(id: string, includeFullSensitive = false) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        branch: true,
        shift: true,
        salaryStructures: {
          orderBy: { effectiveFrom: 'desc' },
        },
        deviceMaps: {
          include: { device: true },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
      },
    });

    if (!employee || employee.deletedAt) {
      throw new AppError('Teacher record not found or has been deleted.', 404);
    }

    const decryptedPan = decrypt(employee.panNumber);
    const decryptedBank = decrypt(employee.bankAccountNumber);

    return {
      ...employee,
      panNumber: includeFullSensitive ? decryptedPan : maskSensitive(decryptedPan),
      bankAccountNumber: includeFullSensitive ? decryptedBank : maskSensitive(decryptedBank),
    };
  }

  static async createEmployee(data: any) {
    // 1. Generate unique, non-editable ID: TCH-0001
    const employeeId = await generateNextEmployeeId();

    // 2. Encrypt sensitive numbers
    const encryptedPan = encrypt(data.panNumber);
    const encryptedBank = encrypt(data.bankAccountNumber);

    // 3. Compute Gross Salary
    const basic = Number(data.basicSalary || 0);
    const hra = Number(data.hra || 0);
    const da = Number(data.da || 0);
    const special = Number(data.specialAllowance || 0);
    const conveyance = Number(data.conveyance || 0);
    const other = Number(data.otherAllowances || 0);
    const grossSalary = basic + hra + da + special + conveyance + other;

    const joiningDate = new Date(data.joiningDate);

    // Format designation with teaching subject and assigned class if provided
    let finalDesignation = data.designation;
    if (data.subject && !finalDesignation.toLowerCase().includes(data.subject.toLowerCase())) {
      finalDesignation = `${finalDesignation} (${data.subject})`;
    }
    if (data.assignedClass && !finalDesignation.toLowerCase().includes(data.assignedClass.toLowerCase())) {
      finalDesignation = `${finalDesignation} • ${data.assignedClass}`;
    }

    // Database transaction to ensure employee + salary structure + device map + user account are created together
    return prisma.$transaction(async (tx) => {
      // Resolve branchId safely
      let branchId = data.branchId;
      if (!branchId) {
        const defaultBranch = await tx.branch.findFirst();
        branchId = defaultBranch?.id;
      }
      if (!branchId) {
        const newBranch = await tx.branch.create({
          data: {
            code: 'MAIN-01',
            name: 'Main Campus',
            address: 'Achievers Home Public School Campus',
          },
        });
        branchId = newBranch.id;
      }

      // Create Employee
      const employee = await tx.employee.create({
        data: {
          employeeId,
          name: data.name,
          email: data.email?.toLowerCase() || null,
          mobile: data.mobile,
          departmentId: data.departmentId || null,
          designation: finalDesignation,
          branchId,
          shiftId: data.shiftId || null,
          joiningDate,
          salaryBasis: data.salaryBasis || SalaryBasis.CALENDAR_DAYS,
          panNumber: encryptedPan,
          bankAccountNumber: encryptedBank,
          bankName: data.bankName || null,
          bankIfsc: data.bankIfsc || null,
          status: EmployeeStatus.ACTIVE,
        },
      });

      // Create Initial Salary Structure
      await tx.salaryStructure.create({
        data: {
          employeeId: employee.id,
          effectiveFrom: joiningDate,
          basicSalary: basic,
          hra,
          da,
          specialAllowance: special,
          conveyance,
          otherAllowances: other,
          grossSalary,
          isActive: true,
        },
      });

      // Map to biometric device if provided
      if (data.deviceId && data.deviceUserId) {
        await tx.deviceEmployeeMap.create({
          data: {
            deviceId: data.deviceId,
            employeeId: employee.id,
            deviceUserId: String(data.deviceUserId),
          },
        });
      }

      // Automatically create User Login if email is provided
      if (data.createLogin && data.email) {
        const passwordHash = await AuthService.hashPassword(data.loginPassword || 'Teacher@12345');
        const existingUser = await tx.user.findUnique({
          where: { email: data.email.toLowerCase() },
        });

        if (existingUser) {
          await tx.user.update({
            where: { id: existingUser.id },
            data: {
              passwordHash,
              role: UserRole.TEACHER,
              employeeId: employee.id,
              isActive: true,
            },
          });
        } else {
          await tx.user.create({
            data: {
              name: data.name,
              email: data.email.toLowerCase(),
              passwordHash,
              role: UserRole.TEACHER,
              employeeId: employee.id,
              isActive: true,
              isFirstLogin: false,
            },
          });
        }
      }

      // Initialize leave balances for current calendar year
      const currentYear = new Date().getFullYear();
      const leaveTypes = await tx.leaveType.findMany({ where: { isActive: true } });
      for (const lt of leaveTypes) {
        await tx.leaveBalance.create({
          data: {
            employeeId: employee.id,
            leaveTypeId: lt.id,
            year: currentYear,
            allocatedDays: lt.defaultDaysPerYear,
            usedDays: 0,
            pendingDays: 0,
          },
        });
      }

      return employee;
    });
  }

  static async updateEmployee(id: string, data: any) {
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) throw new AppError('Employee not found.', 404);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email?.toLowerCase();
    if (data.mobile !== undefined) updateData.mobile = data.mobile;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.designation !== undefined) updateData.designation = data.designation;
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (data.shiftId !== undefined) updateData.shiftId = data.shiftId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.salaryBasis !== undefined) updateData.salaryBasis = data.salaryBasis;
    if (data.leavingDate !== undefined) {
      updateData.leavingDate = data.leavingDate ? new Date(data.leavingDate) : null;
    }
    if (data.panNumber) updateData.panNumber = encrypt(data.panNumber);
    if (data.bankAccountNumber) updateData.bankAccountNumber = encrypt(data.bankAccountNumber);
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.bankIfsc !== undefined) updateData.bankIfsc = data.bankIfsc;

    return prisma.employee.update({
      where: { id },
      data: updateData,
    });
  }

  static async mapDevice(employeeId: string, deviceId: string, deviceUserId: string) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new AppError('Employee not found.', 404);

    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new AppError('Biometric device not found.', 404);

    return prisma.deviceEmployeeMap.upsert({
      where: {
        deviceId_deviceUserId: {
          deviceId,
          deviceUserId,
        },
      },
      update: {
        employeeId,
        isActive: true,
      },
      create: {
        deviceId,
        employeeId,
        deviceUserId,
      },
    });
  }

  static async deactivateEmployee(id: string, reason?: string) {
    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new AppError('Employee not found.', 404);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id },
        data: {
          status: EmployeeStatus.INACTIVE,
          leavingDate: new Date(),
        },
      });

      // Also deactivate associated user login if exists
      await tx.user.updateMany({
        where: { employeeId: id },
        data: { isActive: false },
      });

      return updated;
    });
  }

  static async bulkImport(records: any[], branchId: string) {
    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        if (!row.name || !row.mobile || !row.designation) {
          throw new Error(`Row ${i + 1}: Name, mobile and designation are required.`);
        }

        await this.createEmployee({
          name: row.name,
          email: row.email || null,
          mobile: String(row.mobile),
          designation: row.designation,
          branchId: row.branchId || branchId,
          joiningDate: row.joiningDate || new Date().toISOString().split('T')[0],
          basicSalary: Number(row.basicSalary || 30000),
          hra: Number(row.hra || 0),
          da: Number(row.da || 0),
          specialAllowance: Number(row.specialAllowance || 0),
          deviceUserId: row.deviceUserId ? String(row.deviceUserId) : undefined,
          createLogin: true,
        });
        results.imported++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${i + 1} (${row.name || 'Unknown'}): ${err.message}`);
      }
    }

    return results;
  }
}

