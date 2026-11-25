export interface RawDevicePunch {
  deviceUserId: string;
  punchTime: Date;
  punchType?: 'CHECK_IN' | 'CHECK_OUT' | 'UNKNOWN';
  verifyType?: 'FINGERPRINT' | 'FACE' | 'RFID' | 'PASSWORD' | 'MANUAL';
  rawPayload?: any;
}

export interface DeviceAdapterResult {
  success: boolean;
  message: string;
  punches?: RawDevicePunch[];
  recordsFetched?: number;
}

export interface IDeviceAdapter {
  deviceId: string;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  fetchLogs(since?: Date): Promise<DeviceAdapterResult>;
  pushReceiver(payload: any, headers?: any): Promise<RawDevicePunch[]>;
  healthCheck(): Promise<{ isOnline: boolean; latencyMs?: number; details?: any }>;
}

export abstract class BaseDeviceAdapter implements IDeviceAdapter {
  public deviceId: string;
  protected ipAddress?: string;
  protected port?: number;
  protected secretToken?: string;

  constructor(deviceId: string, config: { ipAddress?: string; port?: number; secretToken?: string }) {
    this.deviceId = deviceId;
    this.ipAddress = config.ipAddress;
    this.port = config.port || 4370;
    this.secretToken = config.secretToken;
  }

  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract fetchLogs(since?: Date): Promise<DeviceAdapterResult>;
  abstract pushReceiver(payload: any, headers?: any): Promise<RawDevicePunch[]>;
  abstract healthCheck(): Promise<{ isOnline: boolean; latencyMs?: number; details?: any }>;
}

