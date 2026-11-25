import { prisma } from '../../config/db.js';
import { ZKTecoAdapter } from '../../connectors/zkteco.adapter.js';
import { GenericPushAdapter } from '../../connectors/generic-push.adapter.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { DeviceCommType, DeviceStatus } from '@prisma/client';

export class DevicesService {
  static async listDevices() {
    return prisma.device.findMany({
      include: {
        branch: { select: { id: true, name: true, code: true } },
        _count: {
          select: {
            deviceEmployeeMaps: true,
            rawPunches: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getDeviceById(id: string) {
    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        branch: true,
        deviceEmployeeMaps: {
          include: {
            employee: {
              select: { id: true, employeeId: true, name: true, designation: true },
            },
          },
        },
        syncLogs: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!device) throw new AppError('Biometric device not found.', 404);
    return device;
  }

  static async createDevice(data: any) {
    return prisma.device.create({
      data: {
        deviceCode: data.deviceCode,
        name: data.name,
        brand: data.brand || 'ZKTeco',
        model: data.model || null,
        ipAddress: data.ipAddress || null,
        port: data.port ? parseInt(data.port, 10) : 4370,
        location: data.location || null,
        branchId: data.branchId || null,
        communicationType: data.communicationType || DeviceCommType.PUSH_RECEIVER,
        secretToken: data.secretToken || null,
        status: DeviceStatus.ONLINE,
      },
    });
  }

  static async updateDevice(id: string, data: any) {
    return prisma.device.update({
      where: { id },
      data,
    });
  }

  static async deleteDevice(id: string) {
    return prisma.device.delete({
      where: { id },
    });
  }

  static async triggerSync(id: string) {
    const device = await prisma.device.findUnique({ where: { id } });
    if (!device) throw new AppError('Device not found.', 404);

    let adapter;
    if (device.communicationType === DeviceCommType.LAN_POLL) {
      adapter = new ZKTecoAdapter(device.id, {
        ipAddress: device.ipAddress || undefined,
        port: device.port || undefined,
        secretToken: device.secretToken || undefined,
      });
    } else {
      adapter = new GenericPushAdapter(device.id, {
        secretToken: device.secretToken || undefined,
      });
    }

    const health = await adapter.healthCheck();
    const syncResult = await adapter.fetchLogs();

    await prisma.device.update({
      where: { id },
      data: {
        status: health.isOnline ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE,
        lastSyncAt: new Date(),
        lastHeartbeatAt: new Date(),
      },
    });

    return {
      health,
      syncResult,
    };
  }

  static async getDeviceLogs(id: string) {
    return prisma.syncLog.findMany({
      where: { deviceId: id },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }
}

