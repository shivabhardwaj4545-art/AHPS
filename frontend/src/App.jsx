import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './store/authContext.jsx';

import { AdminLayout } from './layouts/AdminLayout.jsx';
import { AuthLayout } from './layouts/AuthLayout.jsx';
import { ProtectedRoute, RoleRoute } from './routes/ProtectedRoute.jsx';

// Feature Views
import { Login } from './features/auth/Login.jsx';
import { Dashboard } from './features/dashboard/Dashboard.jsx';
import { TeacherList } from './features/teachers/TeacherList.jsx';
import { DeviceList } from './features/devices/DeviceList.jsx';
import { DailyAttendance } from './features/attendance/DailyAttendance.jsx';
import { MonthlyAttendanceGrid } from './features/attendance/MonthlyAttendanceGrid.jsx';
import { LeaveManagement } from './features/leaves/LeaveManagement.jsx';
import { PayrollManagement } from './features/payroll/PayrollManagement.jsx';
import { ReportsView } from './features/reports/ReportsView.jsx';
import { HrmsReports } from './features/reports/HrmsReports.jsx';
import { SettingsView } from './features/settings/SettingsView.jsx';
import { TeacherPortal } from './features/teacherPortal/TeacherPortal.jsx';
import { TeacherLeaves } from './features/leaves/TeacherLeaves.jsx';
import { UserList } from './features/users/UserList.jsx';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Authentication Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                {/* Fallback Root Redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Teacher & Faculty Accessible Routes */}
                <Route element={<RoleRoute allowedRoles={['TEACHER', 'ADMIN', 'SUPER_ADMIN']} />}>
                  <Route path="/portal" element={<TeacherPortal />} />
                  <Route path="/my-leaves" element={<TeacherLeaves />} />
                  <Route path="/hrms-reports" element={<HrmsReports />} />
                  <Route path="/reports/hrms" element={<HrmsReports />} />
                </Route>

                {/* Admin Management Suite Routes */}
                <Route element={<RoleRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/teachers" element={<TeacherList />} />
                  <Route path="/users" element={<UserList />} />
                  <Route path="/devices" element={<DeviceList />} />
                  <Route path="/attendance/daily" element={<DailyAttendance />} />
                  <Route path="/attendance/monthly" element={<MonthlyAttendanceGrid />} />
                  <Route path="/leaves" element={<LeaveManagement />} />
                  <Route path="/payroll" element={<PayrollManagement />} />
                  <Route path="/reports" element={<ReportsView />} />
                  <Route path="/settings" element={<SettingsView />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

