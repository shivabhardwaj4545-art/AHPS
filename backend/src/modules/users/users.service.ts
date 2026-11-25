import { prisma } from '../../config/db.js';
import { AuthService } from '../auth/auth.service.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { UserRole } from '@prisma/client';

export class UsersService {
  static async listUsers(page = 1, limit = 50, role?: UserRole, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          employeeId: true,
          isActive: true,
          isFirstLogin: true,
          lastLoginAt: true,
          createdAt: true,
          employee: {
            select: {
              id: true,
              employeeId: true,
              name: true,
              designation: true,
              mobile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getUserByEmployeeId(employeeId: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId },
          { employee: { employeeId } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employeeId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            designation: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('No login user account found for this employee.', 404);
    }

    return user;
  }

  static async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    employeeId?: string | null;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw new AppError('A user with this email address already exists.', 409);
    }

    const passwordHash = await AuthService.hashPassword(data.password);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role,
        employeeId: data.employeeId || null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  static async updateUser(
    id: string,
    data: { name?: string; email?: string; role?: UserRole; isActive?: boolean; password?: string }
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found.', 404);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Email update with uniqueness validation
    if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (emailTaken && emailTaken.id !== id) {
        throw new AppError('This email is already in use by another user account.', 409);
      }
      updateData.email = data.email.toLowerCase();

      // If user is linked to an employee record, update employee email too
      if (user.employeeId) {
        await prisma.employee.update({
          where: { id: user.employeeId },
          data: { email: data.email.toLowerCase() },
        }).catch(() => null);
      }
    }

    // Password reset / update
    if (data.password && data.password.trim().length > 0) {
      updateData.passwordHash = await AuthService.hashPassword(data.password);
      updateData.isFirstLogin = false;

      // Invalidate existing sessions for security
      await prisma.refreshToken.updateMany({
        where: { userId: id },
        data: { isRevoked: true },
      });
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employeeId: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  static async toggleActive(id: string, isActive: boolean) {
    // If deactivating, also revoke active sessions
    if (!isActive) {
      await prisma.refreshToken.updateMany({
        where: { userId: id },
        data: { isRevoked: true },
      });
    }

    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });
  }
}
