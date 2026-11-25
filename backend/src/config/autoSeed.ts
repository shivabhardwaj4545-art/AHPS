import { prisma } from './db.js';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { logger } from './logger.js';

export async function autoInitializeDatabase() {
  try {
    const adminCount = await prisma.user.count({
      where: { email: 'admin@school.edu' },
    });

    if (adminCount > 0) {
      logger.info('Database already initialized. Admin user verified.');
      return;
    }

    logger.info('🌱 Auto-seeding database for initial launch...');

    // 1. Create Default Branch
    const branch = await prisma.branch.upsert({
      where: { code: 'MAIN-01' },
      update: {},
      create: {
        name: 'Main Public School Campus',
        code: 'MAIN-01',
        address: '100 Knowledge Boulevard, Sector 14, Delhi NCR',
        timezone: 'Asia/Kolkata',
      },
    });

    // 2. Create Departments
    const departments = [
      { name: 'Science & Technology', code: 'SCI' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Languages & Literature', code: 'LANG' },
      { name: 'Social Studies & Humanities', code: 'SOC' },
      { name: 'Physical Education & Arts', code: 'PE' },
      { name: 'Administration', code: 'ADMIN' },
    ];
    for (const dept of departments) {
      await prisma.department.upsert({
        where: { code: dept.code },
        update: {},
        create: dept,
      });
    }

    // 3. Default Shift (9 to 6)
    await prisma.shift.upsert({
      where: { code: 'MORNING-STD' },
      update: {},
      create: {
        name: 'Standard General Shift (9 to 6)',
        code: 'MORNING-STD',
        startTime: '09:00',
        endTime: '18:00',
        gracePeriodMinutes: 15,
        halfDayMinimumMinutes: 240,
        fullDayMinimumMinutes: 480,
        isOvernight: false,
        isDefault: true,
        isActive: true,
      },
    });

    // 4. Default Leave Types
    const leaveTypes = [
      { name: 'Casual Leave', code: 'CL', isPaid: true, defaultDaysPerYear: 12 },
      { name: 'Medical/Sick Leave', code: 'SL', isPaid: true, defaultDaysPerYear: 10 },
      { name: 'Earned Leave', code: 'EL', isPaid: true, defaultDaysPerYear: 15, carryForward: true },
      { name: 'Leave Without Pay', code: 'LWP', isPaid: false, defaultDaysPerYear: 0 },
    ];
    for (const lt of leaveTypes) {
      await prisma.leaveType.upsert({
        where: { code: lt.code },
        update: {},
        create: lt,
      });
    }

    // 5. Seed Admin User
    const salt = await bcrypt.genSalt(12);
    const defaultAdminPass = await bcrypt.hash('Admin@12345', salt);
    await prisma.user.upsert({
      where: { email: 'admin@school.edu' },
      update: {
        passwordHash: defaultAdminPass,
        role: UserRole.ADMIN,
      },
      create: {
        name: 'School Administrator',
        email: 'admin@school.edu',
        passwordHash: defaultAdminPass,
        role: UserRole.ADMIN,
        isActive: true,
        isFirstLogin: false,
      },
    });

    // 6. Seed Default Teacher
    const defaultTeacherPass = await bcrypt.hash('Teacher@12345', salt);
    await prisma.user.upsert({
      where: { email: 'teacher1@school.edu' },
      update: {
        passwordHash: defaultTeacherPass,
        role: UserRole.TEACHER,
      },
      create: {
        name: 'Mrs. Rajeshwari Nair',
        email: 'teacher1@school.edu',
        passwordHash: defaultTeacherPass,
        role: UserRole.TEACHER,
        isActive: true,
        isFirstLogin: false,
      },
    });

    logger.info('✅ Database auto-initialized: admin@school.edu / Admin@12345 ready.');
  } catch (err: any) {
    logger.warn(`Database auto-init notice: ${err?.message || err}`);
  }
}
