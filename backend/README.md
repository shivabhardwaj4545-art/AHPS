# Teacher Attendance & Payroll Management System - Backend REST API

Production-ready backend built with Node.js, Express, TypeScript, Prisma ORM (PostgreSQL), and BullMQ (Redis).

## Core Features & Modules

1. **Authentication & RBAC (`/api/v1/auth`, `/api/v1/users`)**
   - JWT access & refresh token rotation with family revocation protection
   - Password hashing with bcrypt
   - Role-Based Access Control: `ADMIN`, `TEACHER`
   - Strict data isolation: Teachers can ONLY query their own employee data
   - Rate limiting and brute-force protection on authentication routes

2. **Teacher / Employee Master (`/api/v1/employees`)**
   - Auto-generated, non-editable ID format `TCH-0001`
   - Sensitive data (Bank Account, PAN) encrypted at rest using AES-256-GCM
   - CSV / Excel bulk teacher onboarding
   - Biometric device enrollment mapping (no raw templates stored)
   - Deactivation & soft delete

3. **Biometric Integration & Connectors (`/api/v1/device-events`, `src/connectors/`)**
   - Adapter pattern architecture (`IDeviceAdapter`, `BaseDeviceAdapter`)
   - `GenericPushAdapter`: HTTP webhook receiver for push biometric machines
   - `ZKTecoAdapter`: LAN-polling TCP socket adapter stub for on-premise local sync
   - Device Hardware Simulator: `npm run simulate:punches`
   - Idempotency & deduplication protection (`deviceId + deviceUserId + punchTime`)

4. **Configurable Shifts & Holidays (`/api/v1/shifts`, `/api/v1/holidays`)**
   - Custom start/end times, grace period (minutes), half-day thresholds
   - Overnight shift support
   - Institutional holiday calendar and weekly-offs configuration

5. **Attendance Calculation Engine (`/api/v1/attendance`)**
   - Daily processor calculates: Present, Late (stores late minutes), Early leaving, Half-day, Absent, On Leave, Holiday, Weekly Off
   - Missing Punch Detection: Single punch is flagged for Admin review; never assumes a full day
   - Multi-punch pair resolution (first IN, last OUT)
   - Regularization workflow with audit trail of before/after values
   - Period Locking: Locks month closing; prevents edits to locked periods

6. **Leaves Management (`/api/v1/leaves`)**
   - Configurable types: Casual Leave (CL), Sick Leave (SL), Earned Leave (EL), Leave Without Pay (LWP)
   - Real-time annual balance tracking (allocated, used, pending)
   - Application and approval/rejection workflow

7. **Payroll Engine & Salary Register (`/api/v1/payroll`, `/api/v1/reports`)**
   - Divisor options: Calendar days, Working days, Fixed 30
   - Mid-month joining and leaving proration
   - Dynamic salary additions, bonuses, arrears, and loan advance EMI deductions
   - Optional statutory deductions module (PF, ESI, PT, TDS)
   - 4-stage lifecycle: `DRAFT` -> `REVIEWED` -> `APPROVED` -> `PAID`
   - Locked upon approval; changes only permitted through authorized revision
   - Salary hold/release mechanism
   - Automated Excel Salary Register and Bank Transfer CSV export

8. **Payslips (`/api/v1/payslips`)**
   - Electronic PDF payslip generation with institution branding via PDFKit
   - Teacher Portal view and download

9. **Audit Trail & System Logs (`/api/v1/audit-logs`)**
   - Immutable audit logging for all teacher changes, attendance edits, leave approvals, payroll changes, and export actions

---

## Setup & Execution

### 1. Configure Environment
```bash
cp .env.example .env
```

### 2. Database Setup
```bash
npx prisma generate
npx prisma db push
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Unit Tests
```bash
npm test
```

### 5. Run Biometric Hardware Simulator
```bash
npm run simulate:punches
```

---

## Swagger API Documentation
Access the interactive OpenAPI specification in your browser at:
`http://localhost:5000/api/docs`

