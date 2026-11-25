import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

// Route Imports
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import employeesRoutes from './modules/employees/employees.routes.js';
import shiftsRoutes from './modules/shifts/shifts.routes.js';
import holidaysRoutes from './modules/holidays/holidays.routes.js';
import devicesRoutes from './modules/devices/devices.routes.js';
import punchesRoutes from './modules/punches/punches.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import leavesRoutes from './modules/leaves/leaves.routes.js';
import payrollRoutes from './modules/payroll/payroll.routes.js';
import payslipsRoutes from './modules/payslips/payslips.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import auditLogsRoutes from './modules/auditLogs/auditLogs.routes.js';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching whitelist
      const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev flexible
      }
    },
    credentials: true,
  })
);

// Logging & Body Parsers
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply API Rate Limiting to routes
app.use('/api/', apiLimiter);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: env.APP_NAME,
    timestamp: new Date().toISOString(),
    timezone: env.TIMEZONE,
  });
});

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount Modules
const prefix = env.API_PREFIX;
app.use(`${prefix}/auth`, authRoutes);
app.use(`${prefix}/users`, usersRoutes);
app.use(`${prefix}/employees`, employeesRoutes);
app.use(`${prefix}/shifts`, shiftsRoutes);
app.use(`${prefix}/holidays`, holidaysRoutes);
app.use(`${prefix}/devices`, devicesRoutes);
app.use(`${prefix}/`, punchesRoutes); // POST /device-events, GET /punch-events
app.use(`${prefix}/attendance`, attendanceRoutes);
app.use(`${prefix}/leaves`, leavesRoutes);
app.use(`${prefix}/payroll`, payrollRoutes);
app.use(`${prefix}/payslips`, payslipsRoutes);
app.use(`${prefix}/reports`, reportsRoutes);
app.use(`${prefix}/settings`, settingsRoutes);
app.use(`${prefix}/audit-logs`, auditLogsRoutes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.method} ${req.originalUrl} not found.`,
  });
});

// Global Centralized Error Handler
app.use(errorHandler);

export default app;

