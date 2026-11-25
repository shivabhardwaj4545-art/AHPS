import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_NAME: process.env.APP_NAME || 'Teacher Attendance & Payroll Management System',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000',

  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/teacher_attendance_payroll?schema=public',

  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-for-school-attendance-2026-very-secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-jwt-key-for-school-2026-very-secure',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  DEVICE_WEBHOOK_SECRET: process.env.DEVICE_WEBHOOK_SECRET || 'biometric-device-secret-token-2026',

  TIMEZONE: process.env.TIMEZONE || 'Asia/Kolkata',

  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  EXPORT_DIR: process.env.EXPORT_DIR || './exports',
};

