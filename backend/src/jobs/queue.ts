import { Queue, Worker, Job } from 'bullmq';
import { redisClient, isRedisAvailable } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { AttendanceProcessor } from '../modules/attendance/attendance.service.js';
import { DevicesService } from '../modules/devices/devices.service.js';
import { prisma } from '../config/db.js';

export const QUEUE_NAMES = {
  DEVICE_SYNC: 'device-sync-queue',
  ATTENDANCE_PROCESSING: 'attendance-processing-queue',
  PAYROLL_RUNNER: 'payroll-runner-queue',
};

let deviceSyncQueue: Queue | null = null;
let attendanceQueue: Queue | null = null;

// Initialize BullMQ if Redis client is available
if (isRedisAvailable && redisClient) {
  try {
    deviceSyncQueue = new Queue(QUEUE_NAMES.DEVICE_SYNC, { connection: redisClient as any });
    attendanceQueue = new Queue(QUEUE_NAMES.ATTENDANCE_PROCESSING, { connection: redisClient as any });

    // Device Sync Worker
    new Worker(
      QUEUE_NAMES.DEVICE_SYNC,
      async (job: Job) => {
        logger.info(`Running Device Sync Job: ${job.name}`);
        const devices = await prisma.device.findMany();
        for (const dev of devices) {
          try {
            await DevicesService.triggerSync(dev.id);
          } catch (e: any) {
            logger.error(`Error syncing device ${dev.id}: ${e.message}`);
          }
        }
      },
      { connection: redisClient as any }
    );

    // Attendance Processing Worker
    new Worker(
      QUEUE_NAMES.ATTENDANCE_PROCESSING,
      async (job: Job) => {
        logger.info(`Running Scheduled Daily Attendance Processor: ${job.name}`);
        const date = job.data?.date ? new Date(job.data.date) : new Date();
        await AttendanceProcessor.processDailyAttendance(date);
      },
      { connection: redisClient as any }
    );

    logger.info('🚀 BullMQ queues and workers initialized.');
  } catch (err: any) {
    logger.warn(`BullMQ initialization skipped: ${err.message}`);
  }
}

/**
 * Dispatch job: uses BullMQ if active, otherwise executes in background
 */
export const dispatchJob = async (queueName: string, jobName: string, data: any = {}) => {
  if (isRedisAvailable && deviceSyncQueue && attendanceQueue) {
    if (queueName === QUEUE_NAMES.DEVICE_SYNC) {
      return deviceSyncQueue.add(jobName, data);
    }
    if (queueName === QUEUE_NAMES.ATTENDANCE_PROCESSING) {
      return attendanceQueue.add(jobName, data);
    }
  }

  // Graceful direct execution fallback (e.g. for development or without Redis running)
  setImmediate(async () => {
    try {
      if (queueName === QUEUE_NAMES.ATTENDANCE_PROCESSING) {
        await AttendanceProcessor.processDailyAttendance(data?.date ? new Date(data.date) : new Date());
      } else if (queueName === QUEUE_NAMES.DEVICE_SYNC) {
        const devices = await prisma.device.findMany();
        for (const dev of devices) {
          await DevicesService.triggerSync(dev.id);
        }
      }
    } catch (err: any) {
      logger.error(`Fallback job execution error [${queueName}]: ${err.message}`);
    }
  });
};

