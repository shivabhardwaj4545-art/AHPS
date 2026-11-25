import { prisma } from '../../config/db.js';
import { GenericPushAdapter } from '../../connectors/generic-push.adapter.js';
import { SyncStatus } from '@prisma/client';
import { logger } from '../../config/logger.js';

export class PunchesService {
  static async ingestPunches(deviceId: string, payload: any, headers?: any) {
    const startTime = Date.now();
    const adapter = new GenericPushAdapter(deviceId);

    // Standardize raw incoming punches
    const punches = await adapter.pushReceiver(payload, headers);

    let inserted = 0;
    let duplicates = 0;
    let failed = 0;

    for (const p of punches) {
      try {
        await prisma.rawPunchEvent.create({
          data: {
            deviceId,
            deviceUserId: p.deviceUserId,
            punchTime: p.punchTime,
            punchType: p.punchType || 'UNKNOWN',
            verifyType: p.verifyType || 'FINGERPRINT',
            syncStatus: SyncStatus.RAW,
            rawPayload: JSON.stringify(p.rawPayload || {}),
          },
        });
        inserted++;
      } catch (err: any) {
        if (err.code === 'P2002') {
          // Unique constraint violation -> Duplicate punch event safely caught
          duplicates++;
        } else {
          logger.error(`Failed to insert punch event: ${err.message}`);
          failed++;
        }
      }
    }

    const durationMs = Date.now() - startTime;

    // Update device status & heartbeat
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        lastSyncAt: new Date(),
        lastHeartbeatAt: new Date(),
        status: 'ONLINE',
      },
    });

    // Record Sync Log
    await prisma.syncLog.create({
      data: {
        deviceId,
        syncType: 'PUSH_EVENT',
        recordsFetched: punches.length,
        recordsInserted: inserted,
        recordsFailed: failed,
        status: failed === 0 ? 'SUCCESS' : inserted > 0 ? 'PARTIAL' : 'FAILED',
        durationMs,
        startedAt: new Date(startTime),
        completedAt: new Date(),
      },
    });

    return {
      status: 'SUCCESS',
      totalSubmitted: punches.length,
      inserted,
      duplicates,
      failed,
      durationMs,
    };
  }

  static async listPunchEvents(params: {
    page?: number;
    limit?: number;
    deviceId?: string;
    deviceUserId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.deviceId) where.deviceId = params.deviceId;
    if (params.deviceUserId) where.deviceUserId = params.deviceUserId;
    if (params.startDate || params.endDate) {
      where.punchTime = {};
      if (params.startDate) where.punchTime.gte = new Date(params.startDate);
      if (params.endDate) where.punchTime.lte = new Date(params.endDate);
    }

    const [punches, total] = await Promise.all([
      prisma.rawPunchEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { punchTime: 'desc' },
        include: {
          device: {
            select: { id: true, name: true, deviceCode: true, location: true },
          },
        },
      }),
      prisma.rawPunchEvent.count({ where }),
    ]);

    return {
      punches,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

