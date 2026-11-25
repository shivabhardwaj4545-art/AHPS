import { BaseDeviceAdapter, RawDevicePunch, DeviceAdapterResult } from './base.adapter.js';
import { parseISO } from 'date-fns';
import { toIST } from '../utils/date.js';

export class GenericPushAdapter extends BaseDeviceAdapter {
  constructor(deviceId: string, config: { ipAddress?: string; port?: number; secretToken?: string } = { ipAddress: undefined }) {
    super(deviceId, config);
  }

  async connect(): Promise<boolean> {
    return true; // Push adapter listens passively
  }

  async disconnect(): Promise<void> {
    // No-op for passive push receiver
  }

  async fetchLogs(since?: Date): Promise<DeviceAdapterResult> {
    return {
      success: true,
      message: 'Push receiver waits for incoming HTTP device requests.',
      recordsFetched: 0,
      punches: [],
    };
  }

  async healthCheck(): Promise<{ isOnline: boolean; latencyMs?: number; details?: any }> {
    return {
      isOnline: true,
      latencyMs: 1,
      details: { mode: 'HTTP_PUSH_RECEIVER', status: 'READY' },
    };
  }

  /**
   * Normalizes incoming payloads from biometric push machines:
   * Supports:
   * 1. Direct JSON: { userId: "1001", time: "2026-11-14 08:05:00", type: "IN" }
   * 2. Array batches: [{ UserID: "1001", LogTime: "..." }, ...]
   * 3. eSSL / ADMS format: "GET /iclock/cdata?SN=...&table=ATTLOG"
   */
  async pushReceiver(payload: any, headers?: any): Promise<RawDevicePunch[]> {
    const rawEvents: RawDevicePunch[] = [];

    // Check optional token header if configured
    if (this.secretToken && headers) {
      const token = headers['x-device-token'] || headers['authorization'];
      if (token && token !== this.secretToken && !token.includes(this.secretToken)) {
        throw new Error('Device authentication token mismatch.');
      }
    }

    const items = Array.isArray(payload) ? payload : [payload];

    for (const item of items) {
      if (!item) continue;

      // Extract User ID
      const deviceUserId = String(
        item.deviceUserId ||
        item.userId ||
        item.user_id ||
        item.enrollId ||
        item.PIN ||
        item.UserID ||
        item.EnrollNumber ||
        ''
      ).trim();

      if (!deviceUserId) continue;

      // Extract Punch Time
      const timeVal =
        item.punchTime ||
        item.time ||
        item.timestamp ||
        item.LogTime ||
        item.datetime ||
        item.VerifyTime ||
        new Date();

      let punchTime: Date;
      try {
        punchTime = typeof timeVal === 'string' ? parseISO(timeVal) : new Date(timeVal);
        if (isNaN(punchTime.getTime())) {
          punchTime = new Date();
        }
      } catch {
        punchTime = new Date();
      }

      // Extract Punch Type
      let punchType: 'CHECK_IN' | 'CHECK_OUT' | 'UNKNOWN' = 'UNKNOWN';
      const rawType = String(item.punchType || item.type || item.InOutMode || item.Status || '').toUpperCase();
      if (rawType.includes('IN') || rawType === '0' || rawType === 'CHECK_IN') {
        punchType = 'CHECK_IN';
      } else if (rawType.includes('OUT') || rawType === '1' || rawType === 'CHECK_OUT') {
        punchType = 'CHECK_OUT';
      }

      // Extract Verification Method
      let verifyType: 'FINGERPRINT' | 'FACE' | 'RFID' | 'PASSWORD' | 'MANUAL' = 'FINGERPRINT';
      const rawVerify = String(item.verifyType || item.VerifyMode || '').toUpperCase();
      if (rawVerify.includes('FACE') || rawVerify === '15') verifyType = 'FACE';
      else if (rawVerify.includes('CARD') || rawVerify.includes('RFID') || rawVerify === '4') verifyType = 'RFID';
      else if (rawVerify.includes('PWD') || rawVerify.includes('PASS') || rawVerify === '3') verifyType = 'PASSWORD';
      else if (rawVerify.includes('MANUAL')) verifyType = 'MANUAL';

      rawEvents.push({
        deviceUserId,
        punchTime: toIST(punchTime),
        punchType,
        verifyType,
        rawPayload: item,
      });
    }

    return rawEvents;
  }
}

