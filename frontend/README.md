# Teacher Attendance & Payroll Management System - Frontend Portal

Responsive, modern single-page web application engineered for school administrators and teachers.

## Tech Stack & Architecture

- **Build Tool**: Vite
- **UI Framework**: React 18 + Tailwind CSS + Lucide Icons
- **Routing**: React Router DOM v6 with nested Protected and Role-Based Route Guards
- **Data Fetching**: TanStack React Query v5 + Axios Client with JWT Auto-Refresh Interceptor
- **Form Validation**: React Hook Form + Zod

## User Portals & Features

1. **Authentication Portal (`/login`)**
   - Clean security login with email/password
   - Quick one-click evaluation presets (Admin, Teacher)
   - Auto session recovery from local storage and JWT refresh rotation

2. **Executive Dashboard (`/dashboard`)**
   - Staff metrics (Present, Absent, Late, Missing Punches, Approved Leaves)
   - 1-click trigger to execute daily attendance calculation engine
   - Live biometric terminal connectivity pills
   - Today's verified attendance ledger

3. **Teacher Management (`/teachers`)**
   - Complete staff roster with search, filter, and pagination
   - Registration modal with auto-generated non-editable Employee ID (`TCH-XXXX`)
   - Initial salary structure setup (Basic, HRA, DA, Special Allowance)
   - Biometric terminal numeric ID enrollment mapping
   - Bulk CSV import modal

4. **Biometric Terminals (`/devices`)**
   - Terminal cards showing status, IP/Port, location, mapped staff count, last sync time
   - Interactive Ping/Sync trigger
   - Raw hardware sync log viewer
   - Quick instructions to run biometric punch simulator

5. **Daily Attendance Log (`/attendance/daily`)**
   - Calendar date picker
   - Live calculation against shift start times, grace period cutoffs, and half-day thresholds
   - Color-coded status tags: Present, Late (+mins), Early (-mins), Absent, Missing Punch
   - Regularization / correction request workflow with audit reason

6. **Monthly Attendance Matrix (`/attendance/monthly`)**
   - Comprehensive matrix grid (all teachers x calendar days 1 to 31)
   - Compact visual indicators (P, L, H, A, LV, WO, HD, MP)
   - One-click "Lock Month Closing" action to lock the attendance period

7. **Leaves Management (`/leaves`)**
   - Active leave types cards with annual quotas (CL, SL, EL, LWP)
   - Application review table with Approve and Reject actions and audit comments

8. **Payroll & Salaries (`/payroll`)**
   - Month selector
   - Preview and compute monthly payroll with divisor policies (Calendar days / Working days / Fixed 30)
   - Mid-month joining/leaving proration calculation
   - 4-stage lifecycle: `DRAFT` -> `REVIEWED` -> `APPROVED & LOCKED` -> `PAID & PUBLISHED`
   - Salary hold/release toggles
   - 1-click downloads: Excel Salary Register (`.xlsx`) & Bank Transfer CSV (`.csv`)
   - PDF payslip generation and download

9. **Compliance Reports (`/reports`)**
   - Late arrivals breakdown with exact late minutes
   - Absenteeism and unresolved missing punches log
   - Excel and Bank transfer export cards
   - Immutable audit log viewer

10. **System Settings (`/settings`)**
    - Super admin dynamic configuration: Payroll Divisor, Grace period minutes, Statutory deduction module toggle, School legal branding

11. **Teacher Self-Service Portal (`/portal`)**
    - Restricted, isolated portal for authenticated teachers
    - View own profile, designation, joining date, and shift
    - Real-time leave quota balance cards
    - Apply for leave modal
    - Monthly personal attendance history
    - View and download published PDF payslips

---

## Setup & Running Locally

```bash
cp .env.example .env
npm install
npm run dev
```

The frontend server starts at `http://localhost:5173`.

