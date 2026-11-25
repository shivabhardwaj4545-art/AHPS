import { PrismaClient, UserRole, EmployeeStatus, SalaryBasis, DeviceCommType, DeviceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

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
  console.log(`✅ Branch seeded: ${branch.name}`);

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
  console.log('✅ Departments seeded');

  // 3. Create Default Shifts (9:00 AM to 6:00 PM)
  const defaultShift = await prisma.shift.upsert({
    where: { code: 'MORNING-STD' },
    update: {
      startTime: '09:00',
      endTime: '18:00',
      halfDayMinimumMinutes: 240, // 4 hrs
      fullDayMinimumMinutes: 480, // 8 hrs
    },
    create: {
      name: 'Standard General Shift (9 to 6)',
      code: 'MORNING-STD',
      startTime: '09:00',
      endTime: '18:00',
      gracePeriodMinutes: 15,
      halfDayMinimumMinutes: 240, // 4 hrs
      fullDayMinimumMinutes: 480, // 8 hrs
      isOvernight: false,
      isDefault: true,
      isActive: true,
    },
  });

  await prisma.shift.upsert({
    where: { code: 'SENIOR-SECONDARY' },
    update: {},
    create: {
      name: 'Senior Secondary Shift',
      code: 'SENIOR-SECONDARY',
      startTime: '07:30',
      endTime: '14:30',
      gracePeriodMinutes: 15,
      halfDayMinimumMinutes: 210,
      fullDayMinimumMinutes: 360,
      isOvernight: false,
      isDefault: false,
      isActive: true,
    },
  });
  console.log('✅ Shifts seeded');

  // 4. Create Weekly Offs (Sunday off, 2nd & 4th Saturday or full Saturday)
  await prisma.weeklyOff.upsert({
    where: {
      branchId_dayOfWeek: {
        branchId: branch.id,
        dayOfWeek: 0, // Sunday
      },
    },
    update: {},
    create: {
      branchId: branch.id,
      dayOfWeek: 0,
      isHalfDay: false,
    },
  });
  console.log('✅ Weekly Offs seeded');

  // 5. Create Holidays (Sample for 2026)
  const holidays = [
    { name: 'Republic Day', date: new Date('2026-01-26') },
    { name: 'Independence Day', date: new Date('2026-08-15') },
    { name: 'Gandhi Jayanti', date: new Date('2026-10-02') },
    { name: 'Diwali', date: new Date('2026-11-08') },
    { name: 'Christmas Day', date: new Date('2026-12-25') },
  ];

  for (const h of holidays) {
    await prisma.holiday.upsert({
      where: {
        date_branchId: {
          date: h.date,
          branchId: branch.id,
        },
      },
      update: {},
      create: {
        name: h.name,
        date: h.date,
        branchId: branch.id,
      },
    });
  }
  console.log('✅ Holidays seeded');

  // 6. Create Leave Types
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
  console.log('✅ Leave types seeded');

  // 7. Seed System Settings (All Configurable, Never Hardcoded)
  const defaultSettings = [
    { key: 'PAYROLL_CALCULATION_BASIS', value: 'CALENDAR_DAYS', description: 'Days basis for salary calculation: CALENDAR_DAYS, WORKING_DAYS, or FIXED_30', group: 'PAYROLL' },
    { key: 'GRACE_PERIOD_MINUTES', value: '15', description: 'Grace period minutes after shift start time before marked late', group: 'ATTENDANCE' },
    { key: 'LATE_PENALTY_RULE', value: JSON.stringify({ countThreshold: 3, deductHalfDay: true }), description: 'Rule: 3 late arrivals equal 1 half-day deduction', group: 'ATTENDANCE' },
    { key: 'STATUTORY_DEDUCTIONS_ENABLED', value: 'false', description: 'Optional statutory modules (PF, ESI, PT, TDS) enabled flag', group: 'STATUTORY' },
    { key: 'TIMEZONE', value: 'Asia/Kolkata', description: 'Institutional standard timezone', group: 'GENERAL' },
    { key: 'INSTITUTION_NAME', value: 'Achievers Home Public School', description: 'School legal name on payslips and reports', group: 'GENERAL' },
    { key: 'INSTITUTION_LOGO_URL', value: '', description: 'Institution crest logo url', group: 'GENERAL' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('✅ Configurable settings seeded');

  // 8. Seed School Admin User
  const salt = await bcrypt.genSalt(12);
  const defaultAdminPass = await bcrypt.hash('Admin@12345', salt);
  const defaultTeacherPass = await bcrypt.hash('Teacher@12345', salt);

  await prisma.user.upsert({
    where: { email: 'admin@school.edu' },
    update: {
      name: 'School Administrator',
      role: UserRole.ADMIN,
      passwordHash: defaultAdminPass,
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
  console.log('✅ School Admin seeded: admin@school.edu / Admin@12345');

  // 10. Seed Biometric Device
  const device = await prisma.device.upsert({
    where: { deviceCode: 'BIO-GATE-01' },
    update: {},
    create: {
      deviceCode: 'BIO-GATE-01',
      name: 'Main Gate Biometric Terminal',
      brand: 'ZKTeco',
      model: 'SilkBio-101TC',
      ipAddress: '192.168.1.201',
      port: 4370,
      location: 'Administrative Block - Gate 1',
      branchId: branch.id,
      communicationType: DeviceCommType.PUSH_RECEIVER,
      status: DeviceStatus.ONLINE,
      secretToken: 'device-token-secret-01',
    },
  });
  console.log('✅ Biometric device seeded: BIO-GATE-01');

  // 11. Seed Sample Teachers & Employee Records
  const mathDept = await prisma.department.findUnique({ where: { code: 'MATH' } });
  const sciDept = await prisma.department.findUnique({ where: { code: 'SCI' } });
  const langDept = await prisma.department.findUnique({ where: { code: 'LANG' } });

  const teachers = [
    {
      employeeId: 'TCH-0001',
      name: 'Dr. Rajesh Sharma',
      email: 'teacher1@school.edu',
      mobile: '+919876543210',
      designation: 'Senior PGT Mathematics',
      departmentId: mathDept?.id,
      joiningDate: new Date('2024-04-01'),
      basicSalary: 45000,
      hra: 15000,
      da: 9000,
      specialAllowance: 6000,
      deviceUserId: '1001',
    },
    {
      employeeId: 'TCH-0002',
      name: 'Mrs. Sunita Patel',
      email: 'teacher2@school.edu',
      mobile: '+919876543211',
      designation: 'TGT Science',
      departmentId: sciDept?.id,
      joiningDate: new Date('2024-06-15'),
      basicSalary: 38000,
      hra: 12000,
      da: 7600,
      specialAllowance: 4400,
      deviceUserId: '1002',
    },
    {
      employeeId: 'TCH-0003',
      name: 'Mr. Amit Verma',
      email: 'teacher3@school.edu',
      mobile: '+919876543212',
      designation: 'PGT English Literature',
      departmentId: langDept?.id,
      joiningDate: new Date('2024-07-01'),
      basicSalary: 40000,
      hra: 13000,
      da: 8000,
      specialAllowance: 5000,
      deviceUserId: '1003',
    },
  ];

  for (const t of teachers) {
    const gross = t.basicSalary + t.hra + t.da + t.specialAllowance;

    const emp = await prisma.employee.upsert({
      where: { employeeId: t.employeeId },
      update: {},
      create: {
        employeeId: t.employeeId,
        name: t.name,
        email: t.email,
        mobile: t.mobile,
        departmentId: t.departmentId,
        designation: t.designation,
        branchId: branch.id,
        shiftId: defaultShift.id,
        joiningDate: t.joiningDate,
        status: EmployeeStatus.ACTIVE,
        salaryBasis: SalaryBasis.CALENDAR_DAYS,
      },
    });

    // Create User login for Teacher
    await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        name: t.name,
        email: t.email,
        passwordHash: defaultTeacherPass,
        role: UserRole.TEACHER,
        employeeId: emp.id,
        isActive: true,
        isFirstLogin: false,
      },
    });

    // Map to biometric device
    await prisma.deviceEmployeeMap.upsert({
      where: {
        deviceId_deviceUserId: {
          deviceId: device.id,
          deviceUserId: t.deviceUserId,
        },
      },
      update: {},
      create: {
        deviceId: device.id,
        employeeId: emp.id,
        deviceUserId: t.deviceUserId,
      },
    });

    // Create active salary structure
    await prisma.salaryStructure.create({
      data: {
        employeeId: emp.id,
        effectiveFrom: t.joiningDate,
        basicSalary: t.basicSalary,
        hra: t.hra,
        da: t.da,
        specialAllowance: t.specialAllowance,
        conveyance: 2000,
        otherAllowances: 0,
        grossSalary: gross + 2000,
        isActive: true,
      },
    });

    // Seed leave balances for 2026
    const cl = await prisma.leaveType.findUnique({ where: { code: 'CL' } });
    const sl = await prisma.leaveType.findUnique({ where: { code: 'SL' } });
    if (cl) {
      await prisma.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: cl.id, year: 2026 } },
        update: {},
        create: { employeeId: emp.id, leaveTypeId: cl.id, year: 2026, allocatedDays: 12, usedDays: 0, pendingDays: 0 },
      });
    }
    if (sl) {
      await prisma.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: sl.id, year: 2026 } },
        update: {},
        create: { employeeId: emp.id, leaveTypeId: sl.id, year: 2026, allocatedDays: 10, usedDays: 0, pendingDays: 0 },
      });
    }
  }

  console.log('✅ Sample teachers seeded with biometric mappings & salary structures');
  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

