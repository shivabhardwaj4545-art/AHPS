# Production-Grade Teacher Attendance & Payroll Management System

A high-performance, secure, and configurable full-stack enterprise web application engineered for schools and educational institutions. It automates biometric punch ingestion, attendance calculation with grace periods, leave workflows, monthly attendance period lock, salary structure management, and accurate payroll calculation with payslip PDF generation and Excel export.

## Architecture & Tech Stack

- **Backend**: Node.js + Express.js REST API with TypeScript
- **Database**: PostgreSQL with Prisma ORM (full schema migrations, foreign keys, indexes, and seeds)
- **Queue & Background Jobs**: BullMQ + Redis (device sync, attendance processing, payroll runs, report generation) with automatic fallback for non-Redis local dev
- **Biometric Integration**: Extensible Adapter Pattern (`connectors/`) supporting generic HTTP push receiver, ZKTeco LAN polling adapter stub, and an interactive biometric device simulator
- **Security**: JWT access & refresh token rotation, Argon2/bcrypt password hashing, AES-256-GCM encryption for sensitive data (bank account, PAN), Role-Based Access Control (RBAC), Helmet, rate-limiting, and comprehensive immutable audit logging
- **Reporting & Exports**: PDFKit (payslips with institution branding) & ExcelJS (monthly salary register, bank transfer files, attendance grids)
- **API Documentation**: Interactive Swagger/OpenAPI at `/api/docs`
- **Frontend**: React 18 (Vite) + React Router v6 + TanStack Query + React Hook Form + Zod + Tailwind CSS + Lucide Icons
- **Deployment**: Docker & Docker Compose setup for PostgreSQL, Redis, Backend, and Frontend

---

## Directory Structure

```text
teacher-attendance-payroll/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/            (env, db, redis, logger, swagger)
│   │   ├── middlewares/       (auth, rbac, validate, errorHandler, rateLimiter, audit)
│   │   ├── modules/           (auth, users, employees, shifts, holidays, devices, punches, attendance, leaves, payroll, payslips, reports, settings, auditLogs)
│   │   ├── jobs/              (deviceSync, attendanceProcessor, payrollRunner, reportGenerator)
│   │   ├── connectors/        (generic-push.adapter.ts, zkteco.adapter.ts, simulator.ts)
│   │   ├── utils/             (date/IST helpers, id generator, pagination, response helpers, encryption)
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── api/               (axios instance, API endpoints)
│   │   ├── components/        (tables, modals, metrics, badges, charts)
│   │   ├── layouts/           (AdminLayout, AuthLayout)
│   │   ├── features/          (auth, dashboard, teachers, devices, attendance, leaves, payroll, reports, settings, teacherPortal)
│   │   ├── routes/            (ProtectedRoute, RoleRoute, router config)
│   │   ├── store/             (auth state & permissions)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── README.md
├── docs/                      (SRS, API docs, deployment guide, backup/restore guide, user manual)
├── docker-compose.yml
└── README.md
```

---

## Quick Start (Docker)

1. Clone or navigate to the repository:
   ```bash
   cd teacher-attendance-payroll
   ```
2. Start the entire stack:
   ```bash
   docker-compose up --build -d
   ```
3. Access services:
   - **Frontend Web Portal**: http://localhost:5173
   - **Backend API**: http://localhost:5000/api
   - **Swagger API Docs**: http://localhost:5000/api/docs

---

## Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push # or npx prisma migrate dev
npm run seed
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 3. Run Biometric Device Simulator
```bash
cd backend
npm run simulate:punches
```

---

## Default Login Credentials (Seeded)

| Role | Email | Password | Scope |
|------|-------|----------|-------|
| Admin | `admin@school.edu` | `Admin@12345` | Full administrative control: Teacher onboarding, shift schedules, biometric attendance, leaves approval, payroll, settings, and reports |
| Teacher | `teacher1@school.edu` | `Teacher@12345` | Teacher Portal: Daily punch in/out, view own muster roll, apply & track leaves, and download monthly salary slips |

