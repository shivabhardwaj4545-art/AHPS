# User Manual & Standard Operating Procedures (SOP)
## Teacher Attendance & Payroll Management System

---

## 1. System Roles & Access Matrix

| Feature / Screen | Admin | Teacher |
|---|:---:|:---:|
| System Settings & Divisor Rules | Read/Write | Denied |
| Shifts & Branch Master | Read/Write | Denied |
| Teacher Registration & Profile Edit | Read/Write | Denied |
| Biometric Hardware Machine Mapping | Read/Write | Denied |
| Daily / Monthly Attendance Grid | Full View | Own Profile Only |
| Attendance Regularization Approvals | Approve/Reject | Denied |
| Month Closing Lock | Execute | Denied |
| Monthly Payroll Calculation | Full Control | Denied |
| Payroll Approval & Lock | Execute | Denied |
| Bank Transfer CSV & Excel Export | Allowed | Denied |
| Download Electronic PDF Payslip | Any Teacher | Own Payslip Only |
| Apply for Leave | Direct Entry | Self-Service Portal |

---

## 2. Standard Operating Procedures for Administrators

### Step 1: Onboarding a New Teacher
1. Navigate to **Teacher Management** (`/teachers`).
2. Click **Register Teacher**.
3. Fill in teacher details: Full Name, Mobile, Email, Designation, Department, and Date of Joining.
4. Set the **Initial Salary Structure**:
   - Enter Basic Salary, HRA, DA, and Special Allowances.
   - Note: Gross salary is automatically computed in real time.
5. In the **Biometric Enrollment ID Mapping** section:
   - Select the target machine (e.g. `BIO-GATE-01`).
   - Enter the numeric user ID enrolled on the machine (e.g. `1004`).
6. Click **Complete Registration**. The system automatically generates a unique, non-editable ID in `TCH-XXXX` format.

---

### Step 2: Reviewing Daily Attendance Anomalies
1. Navigate to **Daily Attendance** (`/attendance/daily`).
2. Select the target date.
3. Review colored status indicators:
   - **LATE**: The teacher arrived after shift start + grace cutoff (e.g. 08:15 AM). The exact delay in minutes is displayed.
   - **MISSING PUNCH (Orange Badge)**: Only a single punch was recorded. The system flags this for Admin review and **never** assumes a full day.
4. To regularize an anomaly:
   - Click **Correct** on the teacher's row.
   - Choose requested status (`PRESENT`, `HALF_DAY`, or `ON_LEAVE`).
   - Provide the verified First IN and Last OUT times.
   - Enter mandatory audit reason (e.g., "Assigned to exam invigilation duty off-campus").
   - Click **Submit Regularization**. The record is updated, and both before and after states are logged in the immutable audit trail.

---

### Step 3: Monthly Attendance Closing & Lock
1. Navigate to **Monthly Grid** (`/attendance/monthly`).
2. Select the closing month (e.g. `2026-11`).
3. Ensure all pending regularization requests and missing punches are resolved.
4. Click **Lock Month Closing**.
   - Note: Once locked, automated biometric overwrites and retroactive edits are strictly blocked.

---

### Step 4: Monthly Payroll Processing & Payout
1. Navigate to **Payroll & Salaries** (`/payroll`).
2. Select the month (e.g. `2026-11`).
3. Click **Calculate Payroll**:
   - The engine evaluates attendance records, calculates payable days, deducts unpaid absences based on the configured divisor, adds bonuses/arrears, and calculates Net Salary.
4. Review summary metrics: Total Gross, Deductions, and Net Disbursable.
5. If an individual teacher has a pending clearance:
   - Click **Hold Salary** and specify the reason.
6. Click **Mark Reviewed** once initial checks are complete.
7. Click **Approve & Lock**:
   - Locks the payroll run against further edits.
   - Automatically generates electronic payslips for all eligible teachers.
8. Click **Mark Paid & Publish**:
   - Publishes electronic PDF payslips to the Teacher Portal.
9. Click the **Excel** icon to download the full `Salary-Register.xlsx`.
10. Click the **Download** icon to export the `Bank-Transfer.csv` file for corporate bank upload.

---

## 3. Teacher Self-Service Portal Guide

### Logging In
1. Open the portal URL: `http://localhost:5173/login`.
2. Enter your school email (e.g. `teacher1@school.edu`) and password.
3. You will be automatically routed to the **Teacher Portal** (`/portal`).

### Viewing Profile & Attendance
- View your official Employee ID, designation, joining date, and allocated shift.
- Under the **Monthly Attendance** tab, choose any month to view your daily IN/OUT times, late minutes, and attendance status.

### Applying for Leave
1. Click **Apply for Leave** on your portal dashboard.
2. Select the leave type:
   - **Casual Leave (CL)**
   - **Medical / Sick Leave (SL)**
   - **Earned Leave (EL)**
   - **Leave Without Pay (LWP)**
3. Select Start Date and End Date.
4. Check **Apply as Half-Day** if taking a half-day.
5. Enter the reason and click **Submit Leave Request**.
6. Track approval status under your profile.

### Downloading Published Payslips
1. Click the **Published Payslips** tab.
2. For any published month, view the net disbursed amount.
3. Click **PDF Payslip** to download your official institutional salary slip with full earnings, deductions, and attendance breakdown.

