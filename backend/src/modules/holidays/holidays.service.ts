import { prisma } from '../../config/db.js';

export class HolidaysService {
  static async listHolidays(year?: number, branchId?: string) {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(Date.UTC(targetYear, 0, 1));
    const endDate = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59));

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };
    if (branchId) where.branchId = branchId;

    return prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  static async createHoliday(data: { name: string; date: string; branchId?: string; isOptional?: boolean }) {
    return prisma.holiday.create({
      data: {
        name: data.name,
        date: new Date(data.date),
        branchId: data.branchId || null,
        isOptional: Boolean(data.isOptional),
      },
    });
  }

  static async deleteHoliday(id: string) {
    return prisma.holiday.delete({ where: { id } });
  }

  static async listWeeklyOffs(branchId?: string) {
    const where = branchId ? { branchId } : {};
    return prisma.weeklyOff.findMany({ where, orderBy: { dayOfWeek: 'asc' } });
  }

  static async updateWeeklyOffs(branchId: string, days: { dayOfWeek: number; isHalfDay: boolean }[]) {
    return prisma.$transaction(async (tx) => {
      await tx.weeklyOff.deleteMany({ where: { branchId } });
      return tx.weeklyOff.createMany({
        data: days.map((d) => ({
          branchId,
          dayOfWeek: d.dayOfWeek,
          isHalfDay: d.isHalfDay,
        })),
      });
    });
  }
}

