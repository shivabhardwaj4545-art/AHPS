import apiClient from './client.js';

// Local synchronization storage for newly onboarded faculty & credentials
const SYNC_TEACHERS_KEY = 'ahps_synced_teachers';
const SYNC_USERS_KEY = 'ahps_synced_users';
const SYNC_PUNCHES_KEY = 'ahps_synced_punches';
const SYNC_DEVICES_KEY = 'ahps_synced_devices';
const SYNC_LEAVES_KEY = 'ahps_synced_leaves';

export const getSyncedLeaves = () => {
  try {
    const saved = localStorage.getItem(SYNC_LEAVES_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [
    {
      id: 'LEV-101',
      employeeId: 'AHPS-T014',
      employeeCode: 'AHPS-T014',
      employeeName: 'Dr. Rajesh Sharma',
      leaveType: 'Casual Leave (CL)',
      leaveTypeCode: 'CL',
      startDate: '2026-11-19',
      endDate: '2026-11-19',
      duration: '2026-11-19 to 2026-11-19',
      days: 0.5,
      totalDays: 0.5,
      isHalfDay: true,
      reason: 'Urgent family medical visit (post-lunch)',
      status: 'APPROVED',
      appliedAt: '2026-11-18T09:30:00.000Z',
      reviewComments: 'Approved by School Administrator.',
    },
    {
      id: 'LEV-102',
      employeeId: 'AHPS-T029',
      employeeCode: 'AHPS-T029',
      employeeName: 'Mrs. Ananya Sen',
      leaveType: 'Medical / Sick Leave (ML)',
      leaveTypeCode: 'ML',
      startDate: '2026-11-24',
      endDate: '2026-11-25',
      duration: '2026-11-24 to 2026-11-25',
      days: 2.0,
      totalDays: 2.0,
      isHalfDay: false,
      reason: 'Viral fever and physician-advised rest',
      status: 'PENDING',
      appliedAt: '2026-11-23T16:45:00.000Z',
      reviewComments: 'Substitute assigned for Class IX-A.',
    },
    {
      id: 'LEV-103',
      employeeId: 'AHPS-T008',
      employeeCode: 'AHPS-T008',
      employeeName: 'Mr. Harpreet Singh',
      leaveType: 'Earned Leave (EL)',
      leaveTypeCode: 'EL',
      startDate: '2026-11-27',
      endDate: '2026-11-29',
      duration: '2026-11-27 to 2026-11-29',
      days: 3.0,
      totalDays: 3.0,
      isHalfDay: false,
      reason: 'Son higher secondary sports trials & travel',
      status: 'PENDING',
      appliedAt: '2026-11-22T10:15:00.000Z',
      reviewComments: '',
    },
    {
      id: 'LEV-104',
      employeeId: 'AHPS-T045',
      employeeCode: 'AHPS-T045',
      employeeName: 'Mr. Vikram Rathore',
      leaveType: 'Casual Leave (CL)',
      leaveTypeCode: 'CL',
      startDate: '2026-12-05',
      endDate: '2026-12-05',
      duration: '2026-12-05 to 2026-12-05',
      days: 1.0,
      totalDays: 1.0,
      isHalfDay: false,
      reason: 'Attending son convocation ceremony',
      status: 'APPROVED',
      appliedAt: '2026-11-20T11:15:00.000Z',
      reviewComments: 'Approved. Advance arrangement verified.',
    },
    {
      id: 'LEV-105',
      employeeId: 'AHPS-T077',
      employeeCode: 'AHPS-T077',
      employeeName: 'Ms. Kavita Nair',
      leaveType: 'Medical / Sick Leave (ML)',
      leaveTypeCode: 'ML',
      startDate: '2026-11-25',
      endDate: '2026-11-26',
      duration: '2026-11-25 to 2026-11-26',
      days: 2.0,
      totalDays: 2.0,
      isHalfDay: false,
      reason: 'Routine dental surgery recovery',
      status: 'REJECTED',
      appliedAt: '2026-11-21T14:00:00.000Z',
      reviewComments: 'Examinations scheduled on these dates. Kindly reschedule.',
    },
  ];
};

export const saveSyncedLeave = (leave) => {
  try {
    const list = getSyncedLeaves();
    const newLeave = {
      id: leave.id || `LEV-${Date.now()}`,
      status: leave.status || 'PENDING',
      appliedAt: new Date().toISOString(),
      startDate: leave.startDate || new Date().toISOString().split('T')[0],
      endDate: leave.endDate || new Date().toISOString().split('T')[0],
      days: leave.days ?? leave.totalDays ?? 1,
      totalDays: leave.totalDays ?? leave.days ?? 1,
      duration: leave.duration || `${leave.startDate} to ${leave.endDate}`,
      ...leave,
    };
    list.unshift(newLeave);
    localStorage.setItem(SYNC_LEAVES_KEY, JSON.stringify(list));
    return newLeave;
  } catch (e) {
    console.error('Error saving synced leave:', e);
    return leave;
  }
};

export const updateSyncedLeave = (id, action, reviewComments = '') => {
  try {
    const list = getSyncedLeaves();
    const idx = list.findIndex((l) => l.id === id);
    if (idx >= 0) {
      list[idx].status = action;
      list[idx].reviewComments = reviewComments;
      list[idx].reviewedAt = new Date().toISOString();
      localStorage.setItem(SYNC_LEAVES_KEY, JSON.stringify(list));
      return list[idx];
    }
  } catch (e) {
    console.error('Error updating synced leave:', e);
  }
  return null;
};

export const getSyncedPunches = () => {
  try {
    return JSON.parse(localStorage.getItem(SYNC_PUNCHES_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveSyncedPunch = (punch) => {
  try {
    const list = getSyncedPunches();
    const newEntry = {
      id: punch.id || `PUNCH-${Date.now()}`,
      timestamp: punch.timestamp || new Date().toISOString(),
      punchTime: punch.punchTime || new Date().toISOString(),
      punchType: punch.punchType || 'CHECK_IN',
      verifyType: punch.verifyType || 'FINGERPRINT',
      deviceName: punch.deviceName || 'Main Gate Terminal #01',
      deviceSerial: punch.deviceSerial || 'ZK-8849201478',
      ...punch,
    };
    list.unshift(newEntry);
    localStorage.setItem(SYNC_PUNCHES_KEY, JSON.stringify(list.slice(0, 100)));
    return newEntry;
  } catch (e) {
    console.error('Error saving punch locally:', e);
    return punch;
  }
};

export const getSyncedDevices = () => {
  try {
    const saved = localStorage.getItem(SYNC_DEVICES_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [
    {
      id: 'DEV-01',
      deviceCode: 'BIO-GATE-01',
      name: 'Main Campus Gate Terminal #01',
      brand: 'ZKTeco uFace 800 Plus',
      serialNumber: 'ZK-8849201478',
      location: 'School Main Gate Entrance',
      commType: 'ADMS_CLOUD_PUSH',
      ipAddress: '192.168.1.101',
      port: 80,
      status: 'ONLINE',
      lastPing: 'Just now',
      verifiedToday: 42,
    },
    {
      id: 'DEV-02',
      deviceCode: 'BIO-STAFF-02',
      name: 'Senior Staff Room Terminal #02',
      brand: 'eSSL SilkBio-101TC Cloud Relay',
      serialNumber: 'ESSL-9921004125',
      location: 'Staff Common Room Floor 2',
      commType: 'CLOUD_WEBHOOK',
      ipAddress: '192.168.1.102',
      port: 443,
      status: 'ONLINE',
      lastPing: '2 mins ago',
      verifiedToday: 38,
    },
  ];
};

export const saveSyncedDevices = (devices) => {
  try {
    localStorage.setItem(SYNC_DEVICES_KEY, JSON.stringify(devices));
  } catch (e) {
    console.error('Error saving devices locally:', e);
  }
};

export const getSyncedTeachers = () => {
  try {
    return JSON.parse(localStorage.getItem(SYNC_TEACHERS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveSyncedTeacher = (teacher, userAccount) => {
  try {
    const teachers = getSyncedTeachers();
    const idx = teachers.findIndex((t) => t.id === teacher.id || (t.email && t.email === teacher.email));
    if (idx >= 0) {
      teachers[idx] = { ...teachers[idx], ...teacher };
    } else {
      teachers.unshift(teacher);
    }
    localStorage.setItem(SYNC_TEACHERS_KEY, JSON.stringify(teachers));

    if (userAccount) {
      const users = JSON.parse(localStorage.getItem(SYNC_USERS_KEY) || '[]');
      const uIdx = users.findIndex((u) => u.email === userAccount.email);
      if (uIdx >= 0) {
        users[uIdx] = { ...users[uIdx], ...userAccount };
      } else {
        users.unshift(userAccount);
      }
      localStorage.setItem(SYNC_USERS_KEY, JSON.stringify(users));
    }
  } catch (e) {
    console.error('Error syncing teacher locally:', e);
  }
};

export const authApi = {
  login: (data) => apiClient.post('/auth/login', data),
  logout: (data) => apiClient.post('/auth/logout', data),
  me: () => apiClient.get('/auth/me'),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
};

export const usersApi = {
  list: (params) => apiClient.get('/users', { params }),
  getById: (id) => apiClient.get(`/users/${id}`),
  getByEmployeeId: (empId) => apiClient.get(`/users/by-employee/${empId}`),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.patch(`/users/${id}`, data),
  toggleStatus: (id, isActive) => apiClient.patch(`/users/${id}/toggle-status`, { isActive }),
};

export const employeesApi = {
  list: async (params) => {
    let serverList = [];
    try {
      const res = await apiClient.get('/employees', { params });
      serverList = res.data || [];
    } catch (e) {
      // Backend offline or error fallback
    }

    const deletedIds = JSON.parse(localStorage.getItem('ahps_deleted_teachers') || '[]');
    const synced = getSyncedTeachers();

    // Deduplicate and merge records cleanly
    const merged = [];
    const seenCodes = new Set();
    const seenEmails = new Set();
    const seenNames = new Set();

    // Prefer synced records (contain latest edits)
    const combined = [...synced, ...serverList];

    for (const item of combined) {
      const id = item.id;
      const code = (item.employeeCode || item.employeeId || '').toUpperCase();
      const email = (item.email || '').toLowerCase().trim();
      const name = (item.name || '').toLowerCase().trim();

      if (deletedIds.includes(id) || (code && deletedIds.includes(code))) {
        continue;
      }

      // Check if already in merged
      if (
        (code && seenCodes.has(code)) ||
        (email && seenEmails.has(email)) ||
        (name && seenNames.has(name) && code)
      ) {
        continue;
      }

      if (code) seenCodes.add(code);
      if (email) seenEmails.add(email);
      if (name) seenNames.add(name);

      merged.push({
        ...item,
        employeeCode: item.employeeCode || item.employeeId || code,
        employeeId: item.employeeId || item.employeeCode || code,
        clQuota: item.clQuota ?? 12,
        elQuota: item.elQuota ?? 15,
        mlQuota: item.mlQuota ?? 10,
      });
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      return {
        data: merged.filter(
          (t) =>
            t.name?.toLowerCase().includes(q) ||
            t.employeeCode?.toLowerCase().includes(q) ||
            t.subject?.toLowerCase().includes(q) ||
            t.email?.toLowerCase().includes(q)
        ),
      };
    }

    return { data: merged };
  },
  getById: async (id) => {
    try {
      const res = await apiClient.get(`/employees/${id}`);
      if (res?.data) return res;
    } catch {}
    const synced = getSyncedTeachers();
    const found = synced.find((t) => t.id === id || t.employeeCode === id || t.employeeId === id);
    if (found) return { data: found };
    return { data: null };
  },
  create: async (data) => {
    let serverRes = null;
    try {
      serverRes = await apiClient.post('/employees', data);
    } catch (e) {
      console.warn('Backend API create notice (falling back to synchronized store):', e);
    }

    const id = serverRes?.data?.id || `TCH-${Date.now().toString().slice(-4)}`;
    const employeeCode =
      serverRes?.data?.employeeId || data.employeeCode || `AHPS-T${Math.floor(100 + Math.random() * 900)}`;

    const basic = Number(data.basicSalary || 0);
    const hra = Number(data.hra || 0);
    const da = Number(data.da || 0);
    const special = Number(data.specialAllowance || 0);
    const grossSalary = basic + hra + da + special;

    const fullTeacher = {
      id,
      employeeId: employeeCode,
      employeeCode,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      designation: data.designation,
      subject: data.subject || 'General Education',
      assignedClass: data.assignedClass || 'Class XII-A',
      department:
        typeof data.department === 'object' && data.department !== null
          ? data.department
          : { name: data.department || 'Science & Mathematics Wing' },
      departmentId: data.departmentId || 'DEP-ACAD',
      joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
      salaryBasis: data.salaryBasis || 'CALENDAR_DAYS',
      basicSalary: basic,
      hra,
      da,
      specialAllowance: special,
      grossSalary,
      bankName: data.bankName || 'State Bank of India',
      bankAccountNumber: data.bankAccountNumber || '••••••••4589',
      bankIfsc: data.bankIfsc || 'SBIN0001234',
      panNumber: data.panNumber || 'ABCDE1234F',
      deviceUserId: data.deviceUserId || '1042',
      clQuota: Number(data.clQuota ?? 12),
      elQuota: Number(data.elQuota ?? 15),
      mlQuota: Number(data.mlQuota ?? 10),
      status: 'ACTIVE',
      ...(serverRes?.data || {}),
    };

    const userAccount = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: data.name,
      email: data.email?.toLowerCase(),
      password: data.loginPassword || 'Teacher@12345',
      role: 'TEACHER',
      employeeId: id,
      employeeCode,
      isActive: true,
      employee: fullTeacher,
    };

    saveSyncedTeacher(fullTeacher, userAccount);
    return serverRes || { data: fullTeacher };
  },
  update: async (id, data) => {
    let serverRes = null;
    try {
      serverRes = await apiClient.patch(`/employees/${id}`, data);
    } catch {}

    const teachers = getSyncedTeachers();
    const idx = teachers.findIndex((t) => t.id === id || t.employeeCode === id || t.email === data.email);

    const basic = Number(data.basicSalary ?? (idx >= 0 ? teachers[idx].basicSalary : 0));
    const hra = Number(data.hra ?? (idx >= 0 ? teachers[idx].hra : 0));
    const da = Number(data.da ?? (idx >= 0 ? teachers[idx].da : 0));
    const special = Number(data.specialAllowance ?? (idx >= 0 ? teachers[idx].specialAllowance : 0));
    const grossSalary = basic + hra + da + special;

    const updated = {
      ...(idx >= 0 ? teachers[idx] : {}),
      ...data,
      id,
      basicSalary: basic,
      hra,
      da,
      specialAllowance: special,
      grossSalary,
      clQuota: Number(data.clQuota ?? (idx >= 0 ? teachers[idx].clQuota : 12)),
      elQuota: Number(data.elQuota ?? (idx >= 0 ? teachers[idx].elQuota : 15)),
      mlQuota: Number(data.mlQuota ?? (idx >= 0 ? teachers[idx].mlQuota : 10)),
    };

    if (idx >= 0) {
      teachers[idx] = updated;
    } else {
      teachers.unshift(updated);
    }
    localStorage.setItem(SYNC_TEACHERS_KEY, JSON.stringify(teachers));

    // Update user credentials if password or email changed
    if (data.email || data.loginPassword) {
      const users = JSON.parse(localStorage.getItem(SYNC_USERS_KEY) || '[]');
      const uIdx = users.findIndex((u) => u.employeeId === id || u.email === data.email);
      if (uIdx >= 0) {
        users[uIdx] = {
          ...users[uIdx],
          email: data.email || users[uIdx].email,
          ...(data.loginPassword ? { password: data.loginPassword } : {}),
          name: data.name || users[uIdx].name,
        };
        localStorage.setItem(SYNC_USERS_KEY, JSON.stringify(users));
      }
    }

    return serverRes || { data: updated };
  },
  delete: async (id) => {
    try {
      await apiClient.delete(`/employees/${id}`);
    } catch {}

    const deletedIds = JSON.parse(localStorage.getItem('ahps_deleted_teachers') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('ahps_deleted_teachers', JSON.stringify(deletedIds));
    }

    const teachers = getSyncedTeachers().filter((t) => t.id !== id && t.employeeCode !== id);
    localStorage.setItem(SYNC_TEACHERS_KEY, JSON.stringify(teachers));
    return { data: { success: true } };
  },
  deactivate: (id, data) => apiClient.post(`/employees/${id}/deactivate`, data),
  mapDevice: (id, data) => apiClient.post(`/employees/${id}/map-device`, data),
  bulkImport: (data) => apiClient.post('/employees/bulk-import', data),
};

export const devicesApi = {
  list: async () => {
    const deletedIds = JSON.parse(localStorage.getItem('ahps_deleted_devices') || '[]');
    let list = [];
    try {
      const res = await apiClient.get('/devices');
      if (res?.data && res.data.length > 0) {
        list = res.data;
      }
    } catch {}
    if (list.length === 0) {
      list = getSyncedDevices();
    }
    const filtered = list.filter(
      (d) => !deletedIds.includes(d.id) && !deletedIds.includes(d.deviceCode)
    );
    return { data: filtered };
  },
  getById: (id) => apiClient.get(`/devices/${id}`),
  create: async (data) => {
    try {
      const res = await apiClient.post('/devices', data);
      return res;
    } catch {}
    const list = getSyncedDevices();
    const newDev = { id: `DEV-${Date.now()}`, ...data, status: 'ONLINE', verifiedToday: 0 };
    list.push(newDev);
    saveSyncedDevices(list);
    return { data: newDev };
  },
  delete: async (id) => {
    try {
      await apiClient.delete(`/devices/${id}`);
    } catch {}
    const deletedIds = JSON.parse(localStorage.getItem('ahps_deleted_devices') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('ahps_deleted_devices', JSON.stringify(deletedIds));
    }
    const list = getSyncedDevices().filter((d) => d.id !== id && d.deviceCode !== id);
    saveSyncedDevices(list);
    return { data: { success: true } };
  },
  sync: (id) => apiClient.post(`/devices/${id}/sync`),
  logs: (id) => apiClient.get(`/devices/${id}/logs`),
};

export const punchesApi = {
  getEvents: async (params) => {
    try {
      const res = await apiClient.get('/punch-events', { params });
      if (res?.data && res.data.length > 0) return res;
    } catch {}
    return { data: getSyncedPunches() };
  },
  pushEvents: async (data) => {
    try {
      await apiClient.post('/device-events', data);
    } catch {}
    saveSyncedPunch(data);
    return { data: { success: true } };
  },
};

export const attendanceApi = {
  getDaily: (params) => apiClient.get('/attendance/daily', { params }),
  getMonthly: (params) => apiClient.get('/attendance/monthly', { params }),
  getTodayPunchStatus: async (params) => {
    try {
      const res = await apiClient.get('/attendance/today', { params });
      if (res?.data) return res;
    } catch {}
    const punches = getSyncedPunches();
    const today = new Date().toISOString().split('T')[0];
    const todayPunches = punches.filter((p) => (p.timestamp || p.punchTime)?.startsWith(today));
    if (todayPunches.length > 0) {
      return {
        data: {
          firstIn: todayPunches[todayPunches.length - 1]?.timestamp || todayPunches[todayPunches.length - 1]?.punchTime,
          lastOut: todayPunches.length > 1 ? todayPunches[0]?.timestamp || todayPunches[0]?.punchTime : null,
          totalPunches: todayPunches.length,
        },
      };
    }
    return { data: null };
  },
  recordPunch: async (data) => {
    try {
      await apiClient.post('/attendance/punch', data);
    } catch {}
    saveSyncedPunch({
      ...data,
      punchTime: data.timestamp || new Date().toISOString(),
      punchType: data.punchType === 'IN' ? 'CHECK_IN' : 'CHECK_OUT',
      verifyType: 'FINGERPRINT',
    });
    return { data: { success: true } };
  },
  processDaily: (data) => apiClient.post('/attendance/process', data),
  requestCorrection: (id, data) => apiClient.post(`/attendance/${id}/correction`, data),
  reviewCorrection: (id, data) => apiClient.patch(`/attendance/corrections/${id}/decision`, data),
  lockPeriod: (month, data) => apiClient.post(`/attendance/periods/${month}/lock`, data),
};

export const leavesApi = {
  getTypes: async () => {
    try {
      const res = await apiClient.get('/leaves/types');
      if (res?.data && res.data.length > 0) return res;
    } catch {}
    return {
      data: [
        { id: 'LT-CL', code: 'CL', name: 'Casual Leave', defaultDaysPerYear: 12, isPaid: true },
        { id: 'LT-EL', code: 'EL', name: 'Earned Leave', defaultDaysPerYear: 15, isPaid: true },
        { id: 'LT-ML', code: 'ML', name: 'Medical / Sick Leave', defaultDaysPerYear: 10, isPaid: true },
        { id: 'LT-LWP', code: 'LWP', name: 'Leave Without Pay', defaultDaysPerYear: 0, isPaid: false },
      ],
    };
  },
  getBalances: async (employeeId) => {
    try {
      const res = await apiClient.get(`/leaves/balances/${employeeId}`);
      if (res?.data && res.data.length > 0) {
        return {
          data: res.data.map((b) => {
            const allowance = Number(b.totalAllowance ?? b.allocatedDays ?? 12) || 0;
            const used = Number(b.usedDays || 0);
            return {
              ...b,
              totalAllowance: allowance,
              allocatedDays: allowance,
              usedDays: used,
              pendingDays: Number(b.pendingDays || 0),
              availableDays: Number(
                b.availableDays !== undefined ? b.availableDays : Math.max(0, allowance - used)
              ),
            };
          }),
        };
      }
    } catch {}

    const allLeaves = getSyncedLeaves();
    // Filter for this employee if given, or match code/id
    const empLeaves = employeeId
      ? allLeaves.filter((l) => l.employeeId === employeeId || l.employeeCode === employeeId)
      : allLeaves;

    const allTeachers = getSyncedTeachers();
    const teacher = allTeachers.find((t) => t.id === employeeId || t.employeeCode === employeeId);

    const quotas = {
      CL: Number(teacher?.clQuota ?? 12),
      EL: Number(teacher?.elQuota ?? 15),
      ML: Number(teacher?.mlQuota ?? 10),
      LWP: 0,
    };

    const used = { CL: 0, EL: 0, ML: 0, LWP: 0 };
    const pending = { CL: 0, EL: 0, ML: 0, LWP: 0 };

    empLeaves.forEach((l) => {
      const code = l.leaveTypeCode || (l.leaveType?.includes('Casual') ? 'CL' : l.leaveType?.includes('Earned') ? 'EL' : l.leaveType?.includes('Medical') ? 'ML' : 'LWP');
      const days = Number(l.days) || 1;
      if (l.status === 'APPROVED') {
        used[code] = (used[code] || 0) + days;
      } else if (l.status === 'PENDING') {
        pending[code] = (pending[code] || 0) + days;
      }
    });

    return {
      data: [
        {
          id: 'BAL-CL',
          leaveType: { id: 'LT-CL', code: 'CL', name: 'Casual Leave (CL)', isPaid: true },
          totalAllowance: quotas.CL,
          usedDays: used.CL,
          pendingDays: pending.CL,
          availableDays: Math.max(0, quotas.CL - used.CL),
        },
        {
          id: 'BAL-EL',
          leaveType: { id: 'LT-EL', code: 'EL', name: 'Earned Leave (EL)', isPaid: true },
          totalAllowance: quotas.EL,
          usedDays: used.EL,
          pendingDays: pending.EL,
          availableDays: Math.max(0, quotas.EL - used.EL),
        },
        {
          id: 'BAL-ML',
          leaveType: { id: 'LT-ML', code: 'ML', name: 'Medical / Sick Leave (ML)', isPaid: true },
          totalAllowance: quotas.ML,
          usedDays: used.ML,
          pendingDays: pending.ML,
          availableDays: Math.max(0, quotas.ML - used.ML),
        },
        {
          id: 'BAL-LWP',
          leaveType: { id: 'LT-LWP', code: 'LWP', name: 'Leave Without Pay (LWP)', isPaid: false },
          totalAllowance: 0,
          usedDays: used.LWP,
          pendingDays: pending.LWP,
          availableDays: 0,
        },
      ],
    };
  },
  listRequests: async (params) => {
    let serverList = [];
    try {
      const res = await apiClient.get('/leaves/requests', { params });
      serverList = res.data || [];
    } catch {}

    const synced = getSyncedLeaves();
    const merged = [];

    // Add synced leaves with normalized format
    for (const item of synced) {
      const empCode = item.employeeCode || item.employeeId || 'AHPS-T014';
      const empName = item.employeeName || 'Faculty Member';
      const typeStr = item.leaveType || 'Casual Leave (CL)';
      const typeCode = item.leaveTypeCode || (typeStr.includes('Casual') ? 'CL' : typeStr.includes('Earned') ? 'EL' : typeStr.includes('Medical') ? 'ML' : 'LWP');
      const start = item.startDate || (item.duration ? item.duration.split(' to ')[0] : '2026-11-20');
      const end = item.endDate || (item.duration ? item.duration.split(' to ')[1] : '2026-11-20');
      const daysCount = item.days ?? item.totalDays ?? 1;

      merged.push({
        id: item.id,
        employeeId: item.employeeId,
        employeeCode: empCode,
        employeeName: empName,
        employee: {
          id: item.employeeId,
          employeeId: empCode,
          employeeCode: empCode,
          name: empName,
        },
        leaveType: {
          id: `LT-${typeCode}`,
          name: typeStr,
          code: typeCode,
        },
        startDate: start,
        endDate: end,
        duration: item.duration || `${start} to ${end}`,
        days: daysCount,
        totalDays: daysCount,
        reason: item.reason || '',
        status: item.status || 'PENDING',
        appliedAt: item.appliedAt || item.createdAt || new Date().toISOString(),
        reviewComments: item.reviewComments || '',
      });
    }

    // Add server leaves if not already present
    for (const item of serverList) {
      if (!merged.some((m) => m.id === item.id)) {
        const empCode = item.employee?.employeeCode || item.employee?.employeeId || 'AHPS-T00';
        const empName = item.employee?.name || 'Faculty Member';
        const typeName = item.leaveType?.name || 'Casual Leave';
        const typeCode = item.leaveType?.code || 'CL';
        const start = item.startDate ? String(item.startDate).slice(0, 10) : '2026-11-20';
        const end = item.endDate ? String(item.endDate).slice(0, 10) : '2026-11-20';
        const daysVal = item.days ?? item.totalDays ?? 1;

        merged.push({
          id: item.id,
          employeeId: item.employee?.id,
          employeeCode: empCode,
          employeeName: empName,
          employee: {
            id: item.employee?.id,
            employeeId: empCode,
            employeeCode: empCode,
            name: empName,
          },
          leaveType: {
            id: item.leaveType?.id || `LT-${typeCode}`,
            name: `${typeName} (${typeCode})`,
            code: typeCode,
          },
          startDate: start,
          endDate: end,
          duration: `${start} to ${end}`,
          days: daysVal,
          totalDays: daysVal,
          reason: item.reason || '',
          status: item.status || 'PENDING',
          appliedAt: item.createdAt,
          reviewComments: item.reviewComments || '',
        });
      }
    }

    if (params?.status) {
      return { data: merged.filter((r) => r.status === params.status) };
    }
    return { data: merged };
  },
  apply: async (data) => {
    let serverRes = null;
    try {
      serverRes = await apiClient.post('/leaves/requests', data);
    } catch {}

    // Calculate days between start and end
    let diffDays = 1;
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffTime = Math.abs(end - start);
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    if (data.isHalfDay) diffDays = 0.5;

    let typeName = 'Casual Leave (CL)';
    let typeCode = 'CL';
    if (data.leaveTypeId === 'LT-EL' || data.leaveTypeId === 'EL') {
      typeName = 'Earned Leave (EL)';
      typeCode = 'EL';
    } else if (data.leaveTypeId === 'LT-ML' || data.leaveTypeId === 'ML') {
      typeName = 'Medical/Sick Leave (SL)';
      typeCode = 'ML';
    } else if (data.leaveTypeId === 'LT-LWP' || data.leaveTypeId === 'LWP') {
      typeName = 'Leave Without Pay (LWP)';
      typeCode = 'LWP';
    }

    const saved = saveSyncedLeave({
      employeeId: data.employeeId || 'AHPS-T014',
      employeeCode: data.employeeCode || 'AHPS-T014',
      employeeName: data.employeeName || 'Dr. Rajesh Sharma',
      leaveType: typeName,
      leaveTypeCode: typeCode,
      startDate: data.startDate,
      endDate: data.endDate,
      duration: `${data.startDate} to ${data.endDate}`,
      days: diffDays,
      isHalfDay: !!data.isHalfDay,
      reason: data.reason,
      status: 'PENDING',
    });

    return serverRes || { data: saved };
  },
  createRequest: async (data) => leavesApi.apply(data),
  review: async (id, data) => {
    try {
      await apiClient.patch(`/leaves/requests/${id}/decision`, data);
    } catch {}
    const updated = updateSyncedLeave(id, data.action, data.reviewComments);
    return { data: updated || { success: true } };
  },
};

export const payrollApi = {
  preview: (data) => apiClient.post('/payroll/preview', data),
  generateDraft: (data) => apiClient.post('/payroll/generate', data),
  getRun: (month, params) => apiClient.get(`/payroll/runs/${month}`, { params }),
  review: (id) => apiClient.post(`/payroll/${id}/review`),
  approve: (id) => apiClient.post(`/payroll/${id}/approve`),
  markPaid: (id) => apiClient.post(`/payroll/${id}/mark-paid`),
  toggleHold: (itemId, data) => apiClient.post(`/payroll/items/${itemId}/hold`, data),
};

export const payslipsApi = {
  getMyPayslips: () => apiClient.get('/payslips/my-payslips'),
  getById: (id) => apiClient.get(`/payslips/${id}`),
  downloadPdf: (id) =>
    apiClient.get(`/payslips/${id}/pdf`, {
      responseType: 'blob',
    }),
};

export const reportsApi = {
  getLateReport: (params) => apiClient.get('/reports/late', { params }),
  getAbsentReport: (params) => apiClient.get('/reports/absent', { params }),
  downloadPayrollExcel: (month) =>
    apiClient.get('/reports/payroll/excel', {
      params: { month },
      responseType: 'blob',
    }),
  downloadBankCsv: (month) =>
    apiClient.get('/reports/payroll/bank-transfer', {
      params: { month },
      responseType: 'blob',
    }),
};

export const settingsApi = {
  list: (group) => apiClient.get('/settings', { params: { group } }),
  update: (data) => apiClient.post('/settings', data),
};

export const auditLogsApi = {
  list: (params) => apiClient.get('/audit-logs', { params }),
};

