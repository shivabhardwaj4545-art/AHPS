import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/endpoints.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('authUser');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Refresh user data from /auth/me
          const res = await authApi.me();
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('authUser', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session validation error:', err);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      const { user: authUser, tokens } = res.data;

      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('authUser', JSON.stringify(authUser));

      setUser(authUser);
      return authUser;
    } catch (err) {
      // Offline / Local Sync fallback: Check newly onboarded teachers in local sync registry
      try {
        const syncedUsers = JSON.parse(localStorage.getItem('ahps_synced_users') || '[]');
        const normalizedInput = email?.trim().toLowerCase();

        const matched = syncedUsers.find(
          (u) =>
            (u.email?.toLowerCase() === normalizedInput ||
              u.employeeCode?.toLowerCase() === normalizedInput ||
              u.employeeId?.toLowerCase() === normalizedInput) &&
            u.password === password
        );

        if (matched) {
          const authUser = {
            id: matched.id,
            name: matched.name,
            email: matched.email,
            role: matched.role || 'TEACHER',
            employeeId: matched.employeeId,
            employeeCode: matched.employeeCode,
            employee: matched.employee,
          };
          localStorage.setItem('accessToken', 'mock-active-teacher-token');
          localStorage.setItem('refreshToken', 'mock-active-teacher-refresh');
          localStorage.setItem('authUser', JSON.stringify(authUser));
          setUser(authUser);
          return authUser;
        }

        // Demo Accounts Fallback
        if (
          (normalizedInput === 'admin@school.edu' || normalizedInput === 'ahps-adm-01') &&
          password === 'Admin@12345'
        ) {
          const authUser = {
            id: 'ADM-001',
            name: 'Dr. Anand Verma',
            email: 'admin@school.edu',
            role: 'ADMIN',
          };
          localStorage.setItem('accessToken', 'mock-admin-token');
          localStorage.setItem('authUser', JSON.stringify(authUser));
          setUser(authUser);
          return authUser;
        }

        if (
          (normalizedInput === 'teacher@school.edu' || normalizedInput === 'ahps-t-042') &&
          password === 'Teacher@12345'
        ) {
          const authUser = {
            id: 'TCH-042',
            name: 'Mrs. Rajeshwari Nair',
            email: 'teacher@school.edu',
            role: 'TEACHER',
            employeeCode: 'AHPS-T-042',
            employee: {
              id: 'TCH-042',
              employeeCode: 'AHPS-T-042',
              name: 'Mrs. Rajeshwari Nair',
              email: 'teacher@school.edu',
              designation: 'Senior PGT Mathematics',
              subject: 'Mathematics',
              assignedClass: 'Class XII-A',
              department: { name: 'Science & Mathematics Wing' },
              basicSalary: 45000,
              hra: 15000,
              da: 9000,
              specialAllowance: 6000,
              grossSalary: 75000,
            },
          };
          localStorage.setItem('accessToken', 'mock-teacher-token');
          localStorage.setItem('authUser', JSON.stringify(authUser));
          setUser(authUser);
          return authUser;
        }
      } catch (storageErr) {
        console.error('Local fallback match error:', storageErr);
      }

      throw new Error(err?.response?.data?.message || err?.message || 'Invalid email or password.');
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      localStorage.clear();
      setUser(null);
      window.location.href = '/login';
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isSuperAdmin,
        isAdmin,
        isAdminOrHR: isAdmin,
        isTeacher,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

