import { prisma } from '../config/db.js';

export const generateNextEmployeeId = async (): Promise<string> => {
  // Find highest existing TCH-XXXX id
  const lastEmployee = await prisma.employee.findFirst({
    where: {
      employeeId: {
        startsWith: 'TCH-',
      },
    },
    orderBy: {
      employeeId: 'desc',
    },
    select: {
      employeeId: true,
    },
  });

  if (!lastEmployee || !lastEmployee.employeeId) {
    return 'TCH-0001';
  }

  const parts = lastEmployee.employeeId.split('-');
  const lastNumber = parseInt(parts[1], 10);
  if (isNaN(lastNumber)) {
    return 'TCH-0001';
  }

  const nextNumber = lastNumber + 1;
  return `TCH-${String(nextNumber).padStart(4, '0')}`;
};

export const generatePayslipNumber = (month: string, employeeId: string): string => {
  // Format: PS-2026-11-TCH-0001
  return `PS-${month}-${employeeId}`;
};

