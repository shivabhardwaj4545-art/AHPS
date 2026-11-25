# REST API Documentation
## Teacher Attendance & Payroll Management System

Interactive Swagger UI documentation is available on the live backend server at:
`http://localhost:5000/api/docs`

Base URL: `/api/v1`

---

## 1. Authentication (`/auth`)

### POST `/auth/login`
Authenticates a user and returns JWT access and refresh tokens.
- **Rate Limit**: 10 attempts per 15 minutes per IP.
- **Request Body**:
```json
{
  "email": "superadmin@school.edu",
  "password": "Admin@12345"
}
```
- **Response 200**:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Super Administrator",
      "email": "superadmin@school.edu",
      "role": "SUPER_ADMIN"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "4a7b...",
      "expiresIn": "1d"
    }
  }
}
```

### POST `/auth/refresh`
Rotates refresh tokens and issues a new token pair.

### POST `/auth/logout`
Revokes the provided refresh token.

### GET `/auth/me`
Returns the currently authenticated user's profile.
- **Headers**: `Authorization: Bearer <accessToken>`

---

## 2. Teachers / Employees (`/employees`)

### GET `/employees`
Lists teachers with pagination and search.
- **Headers**: `Authorization: Bearer <accessToken>`
- **Roles**: `ADMIN`
- **Query Params**: `page=1`, `limit=20`, `search=TCH-0001`, `status=ACTIVE`

### POST `/employees`
Registers a new teacher, auto-generates `TCH-XXXX`, encrypts sensitive details, and creates their initial salary structure.
- **Roles**: `ADMIN`
- **Request Body**:
```json
{
  "name": "Dr. Rajesh Sharma",
  "email": "teacher1@school.edu",
  "mobile": "+919876543210",
  "designation": "PGT Mathematics",
  "branchId": "uuid",
  "joiningDate": "2024-04-01",
  "basicSalary": 45000,
  "hra": 15000,
  "da": 9000,
  "specialAllowance": 6000,
  "deviceId": "uuid",
  "deviceUserId": "1001"
}
```

### GET `/employees/:id`
Retrieves detailed teacher profile. Accessible by Admins or by the Teacher for their own record.

### POST `/employees/:id/map-device`
Maps teacher to numeric biometric machine user ID.

### POST `/employees/bulk-import`
Batch imports teachers from JSON/CSV rows.

---

## 3. Biometric Hardware Events (`/device-events`, `/devices`)

### POST `/device-events`
HTTP push webhook receiver for biometric terminals.
- **Headers**: `x-device-code: BIO-GATE-01`, `x-device-token: secret`
- **Request Body**: Single object or array of raw events:
```json
[
  {
    "deviceUserId": "1001",
    "punchTime": "2026-11-14T07:55:00.000Z",
    "punchType": "CHECK_IN",
    "verifyType": "FACE"
  }
]
```

### POST `/devices/:id/sync`
Triggers an immediate socket ping and log fetch cycle for LAN or cloud device.

---

## 4. Attendance Engine (`/attendance`)

### GET `/attendance/daily`
Fetches verified attendance for a specific date (`?date=YYYY-MM-DD`).

### GET `/attendance/monthly`
Fetches monthly attendance matrix (`?month=YYYY-MM`). Teachers can only view their own records.

### POST `/attendance/process`
Executes daily shift rule and grace cutoff calculation engine for all active teachers.

### POST `/attendance/:id/correction`
Submits an attendance regularization request with reason.

### PATCH `/attendance/corrections/:id/decision`
Admin approves or rejects a regularization request. On approval, attendance is updated and an immutable audit log is generated.

### POST `/attendance/periods/:month/lock`
Closes and locks the monthly attendance period.

---

## 5. Leaves (`/leaves`)

### GET `/leaves/types`
Returns active leave categories (CL, SL, EL, LWP).

### GET `/leaves/balances/:employeeId`
Returns annual quota, used days, and remaining days.

### POST `/leaves/requests`
Submits leave application.

### PATCH `/leaves/requests/:id/decision`
Admin approves or rejects with review comments.

---

## 6. Payroll & Salaries (`/payroll`, `/payslips`)

### POST `/payroll/preview`
Simulates monthly payroll calculations based on attendance, unpaid leaves, and divisors.

### POST `/payroll/generate`
Generates a `DRAFT` payroll run.

### POST `/payroll/:id/review`
Advances state from `DRAFT` to `REVIEWED`.

### POST `/payroll/:id/approve`
Approves and locks payroll; generates electronic payslips.

### POST `/payroll/:id/mark-paid`
Marks payroll as `PAID` and publishes payslips to teachers.

### POST `/payroll/items/:id/hold`
Toggles salary hold with mandatory hold reason.

### GET `/payslips/:id/pdf`
Streams generated electronic PDF payslip with school header.

---

## 7. Reports & Exports (`/reports`)

### GET `/reports/payroll/excel?month=YYYY-MM`
Streams `.xlsx` Monthly Salary Register.

### GET `/reports/payroll/bank-transfer?month=YYYY-MM`
Streams `.csv` Bank Transfer Disbursement batch file.

### GET `/reports/late?month=YYYY-MM`
Returns late arrival analysis.

