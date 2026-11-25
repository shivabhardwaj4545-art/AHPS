# Software Requirements Specification (SRS)
## Teacher Attendance & Payroll Management System

---

## 1. Introduction

### 1.1 Purpose
This document provides the definitive functional and non-functional specifications for the **Teacher Attendance & Payroll Management System**, an enterprise-grade school administrative platform designed to automate biometric punch ingestion, shift adherence verification, leave workflows, attendance period locking, and payroll processing.

### 1.2 Scope
The system addresses common school operational challenges:
- Tracking non-standard teaching hours, extracurricular periods, and exam invigilation duties.
- Processing biometric device logs with time drift, network intermittent latency, and duplicate punches.
- Accurately prorating salaries for mid-month joiners/resignations and calculating deductions for unpaid absences based on configurable divisors (Calendar Days, Working Days, or Fixed 30).
- Generating institutional branded electronic payslips (PDF) and statutory/bank transfer records.
- Enforcing strict backend Role-Based Access Control (RBAC) where teachers can only view their own personal records.

---

## 2. Overall Description

### 2.1 User Classes and Characteristics
1. **Administrator**:
   - Manages institutional configurations, departments, shifts, attendance grace policies, biometric devices, teacher onboarding, daily/monthly attendance reviews, leave approvals, payroll processing, settings, and reports.
2. **Teacher (Self-Service Portal)**:
   - Dedicated portal strictly restricted to punch in/out, viewing their personal profile, monthly attendance record, available leave quotas, leave request status, and downloading published PDF payslips. Access to any other employee's data is denied at the backend API layer.

---

## 3. System Architecture & Data Flow

```text
+-----------------------+           +------------------------+
| Biometric Machine     |           | On-Premise Relay Agent |
| (Push / Webhook / SDK)| --------> | (Optional for NAT/LAN) |
+-----------------------+           +------------------------+
            |                                    |
            +-----------------+------------------+
                              |
                              v
                   [POST /device-events]
                              |
                              v
                  +-----------------------+
                  |  Raw Punch Event DB   | (Immutable Log & Deduplication)
                  +-----------------------+
                              |
                              v
                 [Attendance Calculation Engine]
                 - Matches Device User ID -> Employee ID
                 - Compares with Shift Schedule & Grace Period
                 - Resolves Multi-Punches (First IN / Last OUT)
                 - Detects Missing Punches (Flagged for Admin)
                              |
                              v
                  +-----------------------+
                  | Daily Attendance DB   |
                  +-----------------------+
                              |
                              v
                  [Monthly Closing & Lock]
                              |
                              v
                  [Payroll Calculation Engine]
                  - Gross Salary Breakdown
                  - Divisor Calculation (Calendar / Working / 30)
                  - Unpaid Absence & Proration Deductions
                  - Dynamic Additions & Advance Deductions
                  - Lifecycle: Draft -> Reviewed -> Approved -> Paid
                              |
                              v
                 [PDF Payslips & Bank CSV Exports]
```

---

## 4. Functional Requirements

### 4.1 Master Data & Teacher Onboarding
- **FR-01**: Unique Employee IDs must be auto-generated in `TCH-XXXX` format and rendered immutable after creation.
- **FR-02**: Sensitive numbers (Bank Account Number, PAN Number) must be encrypted using AES-256-GCM before storage and decrypted/masked on retrieval.
- **FR-03**: Biometric machines must be mapped via numeric enrollment IDs. Raw biometric fingerprint/facial vectors must **never** be stored in the database.
- **FR-04**: Bulk onboarding must accept CSV files and provide validation feedback per row.

### 4.2 Attendance Engine & Biometric Integration
- **FR-05**: Biometric events must support both incoming HTTP push receiver webhooks and LAN-polling socket connectors.
- **FR-06**: Idempotent ingestion: A compound unique constraint on `(deviceId, deviceUserId, punchTime)` must discard duplicates silently without crashing.
- **FR-07**: Grace period calculation: If a teacher's first IN punch is after `shiftStartTime + gracePeriodMinutes`, the late arrival duration in minutes must be stored and status tagged as `LATE`.
- **FR-08**: Missing punch handling: If only one punch is recorded for a day, the system must **never** assume a full day. It must flag the day as `MISSING_PUNCH` with `isFlaggedForReview = true`.
- **FR-09**: Period Locking: Admin can lock an attendance month closing. No automated sync or manual edits are permitted on locked periods.

### 4.3 Leaves & Regularization
- **FR-10**: System tracks separate leave type balances (Casual Leave, Sick Leave, Earned Leave, Leave Without Pay).
- **FR-11**: Attendance regularization requests require mandatory reason text and generate audit log entries containing before and after states.

### 4.4 Payroll & Payout Processing
- **FR-12**: Per-day rate calculation must follow the institutionally configured basis: Calendar Days, Working Days (26), or Fixed 30 Days.
- **FR-13**: Mid-month joiners and departures must be automatically prorated against eligible working calendar days.
- **FR-14**: Optional statutory deductions (PF, ESI, PT, TDS) must remain disabled by default unless explicitly activated in settings.
- **FR-15**: Payroll follows an enforced state progression: `DRAFT` -> `REVIEWED` -> `APPROVED` (locked) -> `PAID` (published).
- **FR-16**: Payslips generated via PDFKit must include institution header branding, masked account details, attendance summary, earnings/deductions breakdown, and net salary in INR.

---

## 5. Non-Functional Requirements

- **Security**: JWT access tokens (1 day) + refresh token rotation (7 days) with token reuse detection and revocation. Passwords hashed with bcrypt (salt cost 12).
- **Performance**: Capable of processing 1,000 punch events in under 2 seconds.
- **Availability**: Background jobs queue (BullMQ + Redis) with asynchronous direct execution fallback.
- **Auditability**: Complete audit logs of logins, teacher records, attendance regularization, payroll approvals, and data exports.

