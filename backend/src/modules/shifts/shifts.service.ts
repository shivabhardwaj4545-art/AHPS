import { prisma } from '../../config/db.js';

export class ShiftsService {
  static async listShifts() {
    return prisma.shift.findMany({
      orderBy: { isDefault: 'desc' },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  static async getShiftById(id: string) {
    return prisma.shift.findUnique({ where: { id } });
  }

  static async createShift(data: any) {
    if (data.isDefault) {
      await prisma.shift.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.shift.create({ data });
  }

  static async updateShift(id: string, data: any) {
    if (data.isDefault) {
      await prisma.shift.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return prisma.shift.update({
      where: { id },
      data,
    });
  }

  static async deleteShift(id: string) {
    return prisma.shift.delete({ where: { id } });
  }
}

