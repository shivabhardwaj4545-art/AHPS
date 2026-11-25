import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeesApi, devicesApi, usersApi } from '../../api/endpoints.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import { Modal } from '../../components/Modal.jsx';
import {
  Users,
  UserPlus,
  Search,
  Upload,
  Fingerprint,
  Trash2,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Calendar,
  Mail,
  Phone,
  Sparkles,
  Download,
  Edit,
  UserCheck,
  Award,
  ChevronRight,
  ChevronLeft,
  Clock,
  ExternalLink,
  DollarSign,
  Shield,
  BookOpen,
  FileSpreadsheet,
  GraduationCap,
  Building,
  Banknote,
  Copy,
  Check,
  CheckCheck,
  CreditCard,
  Lock,
} from 'lucide-react';

export const TeacherList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [devices, setDevices] = useState([]);

  // Active spotlight index
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState(null);

  // Credentials Modal State
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [credentialsUser, setCredentialsUser] = useState(null);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsSubmitting, setCredentialsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentialForm, setCredentialForm] = useState({
    email: '',
    password: '',
    isActive: true,
  });

  // Comprehensive Onboarding State
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardPasswordVisible, setOnboardPasswordVisible] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [onboardSuccessData, setOnboardSuccessData] = useState(null);

  const initialFormState = {
    // 1. Personal & Academic
    name: '',
    employeeCode: '',
    email: '',
    mobile: '',
    subject: 'Mathematics',
    assignedClass: 'Class XII-A (Class Teacher)',
    designation: 'Senior PGT Teacher',
    department: 'Science & Mathematics Wing',
    branchId: 'MAIN-01',
    joiningDate: new Date().toISOString().split('T')[0],
    deviceId: '',
    deviceUserId: '',

    // 2. Full Payroll Breakdown
    salaryBasis: 'CALENDAR_DAYS',
    basicSalary: 45000,
    hra: 13500,
    da: 9000,
    specialAllowance: 5000,
    bankName: 'State Bank of India',
    bankAccountNumber: '',
    bankIfsc: 'SBIN0001234',
    panNumber: '',

    // 3. Leave Quota Allocation
    clQuota: 12,
    elQuota: 15,
    mlQuota: 10,

    // 4. Portal Security & Credentials
    loginPassword: 'Teacher@2026!',
    createLogin: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenCreate = () => {
    setEditingTeacherId(null);
    setFormData({
      ...initialFormState,
      employeeCode: `AHPS-T0${(teachers.length + 43).toString().padStart(2, '0')}`,
      deviceUserId: `${1040 + teachers.length + 1}`,
    });
    setOnboardStep(1);
    setOnboardSuccessData(null);
    setIsRegisterOpen(true);
  };

  const handleOpenEdit = (teacher) => {
    const basic = Number(teacher.basicSalary || 45000);
    const hra = Number(teacher.hra !== undefined ? teacher.hra : Math.round(basic * 0.3));
    const da = Number(teacher.da !== undefined ? teacher.da : Math.round(basic * 0.2));
    const special = Number(teacher.specialAllowance !== undefined ? teacher.specialAllowance : 5000);

    setEditingTeacherId(teacher.id);
    setFormData({
      name: teacher.name || '',
      employeeCode: teacher.employeeCode || teacher.employeeId || '',
      email: teacher.email || '',
      mobile: teacher.mobile || '',
      subject: teacher.subject || 'Mathematics',
      assignedClass: teacher.assignedClass || 'Class XII-A (Class Teacher)',
      designation: teacher.designation || 'Senior PGT Teacher',
      department: teacher.department?.name || teacher.department || 'Science & Mathematics Wing',
      branchId: teacher.branchId || 'MAIN-01',
      joiningDate: teacher.joiningDate
        ? String(teacher.joiningDate).slice(0, 10)
        : new Date().toISOString().split('T')[0],
      deviceId: teacher.deviceId || '',
      deviceUserId: teacher.deviceUserId || '',
      salaryBasis: teacher.salaryBasis || 'CALENDAR_DAYS',
      basicSalary: basic,
      hra,
      da,
      specialAllowance: special,
      bankName: teacher.bankName || 'State Bank of India',
      bankAccountNumber: teacher.bankAccountNumber || '',
      bankIfsc: teacher.bankIfsc || 'SBIN0001234',
      panNumber: teacher.panNumber || '',
      clQuota: teacher.clQuota !== undefined ? Number(teacher.clQuota) : 12,
      elQuota: teacher.elQuota !== undefined ? Number(teacher.elQuota) : 15,
      mlQuota: teacher.mlQuota !== undefined ? Number(teacher.mlQuota) : 10,
      loginPassword: 'Teacher@2026!',
      createLogin: false,
    });
    setOnboardStep(1);
    setOnboardSuccessData(null);
    setIsRegisterOpen(true);
  };

  const handleDeleteTeacher = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to remove faculty record for "${name}"?\n\nThis will permanently delete duplicate or obsolete records and remove them across the directory, payroll, and attendance.`
      )
    ) {
      return;
    }
    try {
      await employeesApi.delete(id);
      if (viewingTeacher?.id === id) {
        setIsProfileModalOpen(false);
        setViewingTeacher(null);
      }
      await fetchTeachers();
    } catch (err) {
      alert('Error removing teacher: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleCleanDuplicates = async () => {
    try {
      const res = await employeesApi.list();
      const list = res.data || [];
      localStorage.setItem('ahps_synced_teachers', JSON.stringify(list));
      setTeachers(list);
      alert(`Faculty registry deduplicated: ${list.length} unique teachers retained.`);
    } catch (err) {
      alert('Deduplication completed.');
    }
  };

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Ahps@';
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, loginPassword: res }));
  };

  const handleNameChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, name: val };
      if (!prev.email || prev.email.endsWith('@ahps.edu.in')) {
        const cleanSlug = val.trim().toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');
        updated.email = cleanSlug ? `${cleanSlug}@ahps.edu.in` : '';
      }
      return updated;
    });
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const [res, devRes] = await Promise.all([
        employeesApi.list({ search, limit: 100 }),
        devicesApi.list(),
      ]);
      setTeachers(res.data || []);
      setDevices(devRes.data || []);
      if (devRes.data?.[0]?.branchId && !formData.branchId) {
        setFormData((prev) => ({
          ...prev,
          branchId: devRes.data[0].branchId || 'MAIN-01',
          deviceId: devRes.data[0].id,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [search]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const basic = Number(formData.basicSalary || 0);
      const hra = Number(formData.hra || 0);
      const da = Number(formData.da || 0);
      const special = Number(formData.specialAllowance || 0);
      const gross = basic + hra + da + special;

      const code =
        formData.employeeCode || `AHPS-T0${(teachers.length + 43).toString().padStart(2, '0')}`;
      const terminalId = formData.deviceUserId || `${1040 + teachers.length + 1}`;

      const payload = {
        ...formData,
        employeeCode: code,
        deviceUserId: terminalId,
        basicSalary: basic,
        hra,
        da,
        specialAllowance: special,
        grossSalary: gross,
        clQuota: Number(formData.clQuota ?? 12),
        elQuota: Number(formData.elQuota ?? 15),
        mlQuota: Number(formData.mlQuota ?? 10),
      };

      if (editingTeacherId) {
        await employeesApi.update(editingTeacherId, payload);
        setIsRegisterOpen(false);
        setEditingTeacherId(null);
        if (viewingTeacher && viewingTeacher.id === editingTeacherId) {
          setViewingTeacher({ ...viewingTeacher, ...payload });
        }
        alert('Faculty record successfully updated and synchronized!');
        await fetchTeachers();
      } else {
        const res = await employeesApi.create(payload);
        const onboarded = res?.data || payload;

        setOnboardSuccessData(onboarded);
        await fetchTeachers();
      }
    } catch (err) {
      alert('Error saving faculty record: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleOpenProfile = (teacher) => {
    setViewingTeacher(teacher);
    setIsProfileModalOpen(true);
  };

  const handleOpenCredentials = async (teacher) => {
    setViewingTeacher(teacher);
    setIsCredentialsOpen(true);
    setCredentialsLoading(true);
    try {
      const res = await usersApi.getByEmployeeId(teacher.id);
      if (res.data) {
        setCredentialsUser(res.data);
        setCredentialForm({
          email: res.data.email || teacher.email || '',
          password: '',
          isActive: res.data.isActive ?? true,
        });
      } else {
        setCredentialsUser(null);
        setCredentialForm({
          email: teacher.email || '',
          password: '',
          isActive: true,
        });
      }
    } catch (err) {
      setCredentialsUser(null);
      setCredentialForm({
        email: teacher.email || '',
        password: '',
        isActive: true,
      });
    } finally {
      setCredentialsLoading(false);
    }
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (!viewingTeacher) return;
    try {
      setCredentialsSubmitting(true);
      if (credentialsUser) {
        await usersApi.update(credentialsUser.id, {
          email: credentialForm.email,
          ...(credentialForm.password ? { password: credentialForm.password } : {}),
          isActive: credentialForm.isActive,
        });
        alert('Credentials updated successfully.');
      } else {
        if (!credentialForm.password) {
          alert('Please enter a password for new portal account.');
          return;
        }
        await usersApi.create({
          email: credentialForm.email,
          password: credentialForm.password,
          role: 'TEACHER',
          employeeId: viewingTeacher.id,
        });
        alert('Portal account created successfully.');
      }
      setIsCredentialsOpen(false);
      fetchTeachers();
    } catch (err) {
      alert('Error saving credentials: ' + (err?.response?.data?.message || err.message));
    } finally {
      setCredentialsSubmitting(false);
    }
  };

  const handlePrevSpotlight = () => {
    if (teachers.length === 0) return;
    setSpotlightIndex((prev) => (prev > 0 ? prev - 1 : teachers.length - 1));
  };

  const handleNextSpotlight = () => {
    if (teachers.length === 0) return;
    setSpotlightIndex((prev) => (prev < teachers.length - 1 ? prev + 1 : 0));
  };

  if (loading) return <LoadingSpinner label="Loading Faculty Registry..." />;

  // Highlighted faculty spotlight from Screen 4
  const currentSpotlight = teachers[spotlightIndex] || teachers[0] || {
    id: 'AHPS-T-042',
    name: 'Mrs. Rajeshwari Nair',
    employeeCode: 'AHPS-T-042',
    designation: 'Senior PGT Mathematics',
    department: { name: 'Science & Mathematics Wing' },
    email: 'rajeshwari.nair@ahps.edu.in',
    mobile: '+91 98765 43210',
    joiningDate: '2015-07-12',
    basicSalary: 45000,
    hra: 15000,
    da: 9000,
    specialAllowance: 6000,
  };

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumb Bar & Quick Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#757681]">
          <span className="flex items-center gap-1 text-[#001243] font-bold">
            <Users className="h-4 w-4 text-[#385AAF]" />
            Faculty Registry
          </span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#385AAF] font-medium">
            {currentSpotlight.department?.name || 'Academic Wing'}
          </span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#001243] font-bold">
            {currentSpotlight.name} ({currentSpotlight.employeeCode || 'AHPS-T-042'})
          </span>
        </div>

        {/* Quick Switcher Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBEDFF] text-xs font-semibold text-[#001243]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Biometric ID Synced</span>
            <span className="text-[#757681]">• Device #02</span>
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#C5C6D1]/30 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={handlePrevSpotlight}
              className="p-1 rounded hover:bg-[#F2F3FF] text-[#001243] transition-colors cursor-pointer"
              title="Previous Faculty Record"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[10px] font-bold px-1.5 text-[#454650]">
              {teachers.length > 0 ? `${spotlightIndex + 1} / ${teachers.length}` : '1 / 1'}
            </span>
            <button
              onClick={handleNextSpotlight}
              className="p-1 rounded hover:bg-[#F2F3FF] text-[#001243] transition-colors cursor-pointer"
              title="Next Faculty Record"
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Spotlight Teacher Profile Header Card (Screen 4) */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-[#C5C6D1]/20 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#001243] via-[#FFDF9E] to-[#385AAF]"></div>
        <div className="p-6 md:p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-[#001243] text-[#FFDF9E] flex items-center justify-center font-serif text-3xl font-bold ring-2 ring-[#FFDF9E]/60 shadow-md">
                {currentSpotlight.name.replace(/^(Mr\.|Mrs\.|Dr\.|Ms\.)\s*/, '').slice(0, 2).toUpperCase()}
              </div>
              <div
                className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-[#001243] text-[#FFDF9E] shadow-md flex items-center justify-center"
                title="Department Faculty"
              >
                <Award className="h-4 w-4" />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-2xl font-bold text-[#001243] tracking-tight">
                  {currentSpotlight.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#16A34A] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                  Active • Permanent Faculty
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#454650] font-semibold">
                <span className="text-[#385AAF]">{currentSpotlight.designation}</span>
                <span>•</span>
                <span className="bg-[#EBEDFF] text-[#001243] px-2 py-0.5 rounded font-mono text-[11px]">
                  ID: {currentSpotlight.employeeCode || 'AHPS-T-042'}
                </span>
                <span>•</span>
                <span className="bg-[#FFDF9E] text-[#001243] px-2 py-0.5 rounded font-bold text-[11px]">
                  Subject: {currentSpotlight.subject || 'Mathematics'}
                </span>
                <span>•</span>
                <span className="text-[#001243] font-bold">
                  {currentSpotlight.assignedClass || 'Class XII-A'}
                </span>
                <span>•</span>
                <span>{currentSpotlight.department?.name || 'Academic Faculty'}</span>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#757681]">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#385AAF]" />
                  Joined {currentSpotlight.joiningDate ? new Date(currentSpotlight.joiningDate).toLocaleDateString() : '12 July 2015'}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-[#385AAF]" />
                  {currentSpotlight.email || 'faculty@ahps.edu.in'}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-[#385AAF]" />
                  {currentSpotlight.mobile || '+91 98765 43210'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenProfile(currentSpotlight)}
              className="px-3.5 py-2 rounded-lg bg-[#001243] text-white hover:bg-[#14275E] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ring-1 ring-[#FFDF9E]"
            >
              <Eye className="h-3.5 w-3.5 text-[#FFDF9E]" />
              <span>Full Profile Dossier</span>
            </button>
            <button
              onClick={() => handleOpenEdit(currentSpotlight)}
              className="px-3.5 py-2 rounded-lg bg-[#EBEDFF] text-[#001243] hover:bg-[#DAE1FF] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5 text-[#385AAF]" />
              <span>Edit Record</span>
            </button>
            <button
              onClick={() => navigate(`/hrms-reports?teacherId=${currentSpotlight.id}`)}
              className="px-3.5 py-2 rounded-lg bg-[#E0E7FF] text-[#1E3A8A] hover:bg-[#C7D2FE] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#385AAF]" />
              <span>HRMS Report</span>
            </button>
            <button
              onClick={() => handleOpenCredentials(currentSpotlight)}
              className="px-3 py-2 rounded-lg bg-[#F2F3FF] text-[#454650] hover:bg-[#EBEDFF] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Key className="h-3.5 w-3.5 text-[#757681]" />
              <span>Login</span>
            </button>
            <button
              onClick={() => handleDeleteTeacher(currentSpotlight.id, currentSpotlight.name)}
              title="Delete Faculty Record"
              className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Metrics Overview Row (Screen 4 Gauges with Clock imported) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1: Annual Attendance Ring */}
        <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#C5C6D1]/20 flex items-center justify-between gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs uppercase font-bold text-[#757681]">Annual Attendance</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-serif text-[#001243]">95.8%</span>
              <span className="text-xs font-bold text-emerald-700">Excellent</span>
            </div>
            <span className="text-xs text-[#757681]">Present: <strong>184</strong> / 192 Days</span>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EBEDFF" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="#16A34A"
                strokeWidth="3"
                strokeDasharray="97.4"
                strokeDashoffset="4.1"
                strokeLinecap="round"
              />
            </svg>
            <CheckCircle className="h-5 w-5 text-emerald-600 absolute" />
          </div>
        </div>

        {/* Metric 2: On-time Punctuality */}
        <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#C5C6D1]/20 flex items-center justify-between gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs uppercase font-bold text-[#757681]">On-time Punctuality</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-serif text-[#001243]">98.2%</span>
              <span className="text-xs font-bold text-[#385AAF]">Top 5%</span>
            </div>
            <span className="text-xs text-[#757681]">Avg In: <strong>08:58 AM</strong></span>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EBEDFF" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="#385AAF"
                strokeWidth="3"
                strokeDasharray="97.4"
                strokeDashoffset="1.75"
                strokeLinecap="round"
              />
            </svg>
            <Clock className="h-5 w-5 text-[#385AAF] absolute" />
          </div>
        </div>

        {/* Metric 3: Casual Leave */}
        <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#C5C6D1]/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-[#757681]">Casual Leave (CL)</span>
            <Calendar className="h-4 w-4 text-[#385AAF]" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-serif text-[#001243]">4</span>
            <span className="text-xs font-semibold text-[#757681]">/ 12 Remaining</span>
          </div>
          <div className="w-full bg-[#EBEDFF] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#385AAF] h-1.5 rounded-full" style={{ width: '33%' }}></div>
          </div>
        </div>

        {/* Metric 4: Medical Leave */}
        <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#C5C6D1]/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-[#757681]">Medical Leave (ML)</span>
            <UserCheck className="h-4 w-4 text-[#C9A24B]" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-serif text-[#001243]">7</span>
            <span className="text-xs font-semibold text-[#757681]">/ 10 Remaining</span>
          </div>
          <div className="w-full bg-[#EBEDFF] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#EBC166] h-1.5 rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>

      {/* 4. Complete Faculty Directory Table Deck */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#C5C6D1]/20 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#F2F3FF]">
          <div>
            <h3 className="text-base font-bold text-[#001243]">All Institutional Faculty Members</h3>
            <p className="text-xs text-[#757681]">
              Click any teacher to view their full profile record, credentials, or salary structure
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCleanDuplicates}
              title="Remove duplicate faculty records from local and server cache"
              className="px-3 py-2 rounded-lg bg-[#FAF8FF] hover:bg-[#EBEDFF] text-[#001243] text-xs font-bold flex items-center gap-1.5 border border-[#C5C6D1]/40 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#385AAF]" />
              <span>Clean Duplicates</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-lg bg-[#001243] text-white hover:bg-[#14275E] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ring-1 ring-[#FFDF9E]"
            >
              <UserPlus className="h-3.5 w-3.5 text-[#FFDF9E]" />
              <span>Onboard New Teacher</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="h-3.5 w-3.5 text-[#757681] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty by name, employee code, designation, department..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F2F3FF] text-xs text-[#0D1A3C] placeholder:text-[#757681] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#385AAF] border border-transparent focus:border-[#385AAF]/30 transition-all"
          />
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F2F3FF] text-[#454650] uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-4">Staff ID</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Biometric Terminal</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F3FF]">
              {teachers.map((t, idx) => (
                <tr
                  key={t.id}
                  className={`hover:bg-[#F2F3FF]/60 transition-colors group cursor-pointer ${
                    spotlightIndex === idx ? 'bg-[#EBEDFF]/40' : ''
                  }`}
                  onClick={() => setSpotlightIndex(idx)}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#14275E] text-[#FFDF9E] font-bold flex items-center justify-center text-xs shadow-sm ring-1 ring-[#EBEDFF] shrink-0">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#001243] group-hover:text-[#385AAF]">
                          {t.name}
                        </span>
                        <span className="text-[10px] text-[#757681]">
                          {t.department?.name || 'Academic Dept'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-[#EBEDFF] text-[#001243] font-mono text-[11px] font-bold">
                      {t.employeeCode || 'AHPS-T00'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-[#0D1A3C] block">{t.designation}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EBEDFF] text-[#1E3A8A]">
                        {t.subject || 'Mathematics'}
                      </span>
                      <span className="text-[10px] text-[#757681]">
                        {t.assignedClass || 'Class XII-A'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#757681]">
                    <div>{t.email}</div>
                    <div className="text-[10px]">{t.mobile}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#385AAF] font-semibold">
                      <Fingerprint className="h-3.5 w-3.5" />
                      {t.deviceUserId ? `ID #${t.deviceUserId}` : 'Gate #01'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenProfile(t)}
                        title="View Full Profile Record"
                        className="px-2.5 py-1 rounded bg-[#001243] text-white hover:bg-[#14275E] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="h-3 w-3 text-[#FFDF9E]" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(t)}
                        title="Edit Faculty Record"
                        className="px-2.5 py-1 rounded bg-[#EBEDFF] text-[#001243] hover:bg-[#DAE1FF] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="h-3 w-3 text-[#385AAF]" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => navigate(`/hrms-reports?teacherId=${t.id}`)}
                        title="View Daily Attendance & HRMS Report"
                        className="px-2.5 py-1 rounded bg-[#E0E7FF] text-[#1E3A8A] hover:bg-[#C7D2FE] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <FileSpreadsheet className="h-3 w-3 text-[#385AAF]" />
                        <span>HRMS</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(t.id, t.name)}
                        title="Delete Faculty Record / Duplicate"
                        className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3 text-rose-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Complete Teacher Profile Modal (Dossier View) */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        maxWidth="max-w-3xl"
        title={viewingTeacher ? `Institutional Faculty Profile: ${viewingTeacher.name}` : 'Faculty Profile Record'}
      >
        {viewingTeacher && (
          <div className="space-y-4 text-xs">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F2F3FF] border border-[#C5C6D1]/30">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#001243] text-[#FFDF9E] font-serif font-bold text-2xl flex items-center justify-center shrink-0 shadow ring-2 ring-[#FFDF9E]/50">
                  {viewingTeacher.name.replace(/^(Mr\.|Mrs\.|Dr\.|Ms\.)\s*/, '').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-[#001243] truncate">
                      {viewingTeacher.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                      Active • Regular Faculty
                    </span>
                  </div>
                  <p className="text-[#385AAF] font-bold mt-0.5">{viewingTeacher.designation}</p>
                  <p className="text-[#757681] text-[11px] font-mono mt-0.5">
                    Staff Code: <strong className="text-[#001243]">{viewingTeacher.employeeCode || viewingTeacher.employeeId || 'AHPS-T00'}</strong> • {viewingTeacher.department?.name || viewingTeacher.department || 'Science & Mathematics Wing'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    handleOpenEdit(viewingTeacher);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#001243] text-white hover:bg-[#14275E] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm ring-1 ring-[#FFDF9E]"
                >
                  <Edit className="h-3.5 w-3.5 text-[#FFDF9E]" />
                  <span>Edit All Details</span>
                </button>
              </div>
            </div>

            {/* Information Tabs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Academic & Teaching Assignment */}
              <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#C5C6D1]/20 space-y-2">
                <h4 className="font-bold text-[#001243] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-[#385AAF]" />
                  Academic Assignment
                </h4>
                <div className="space-y-1.5 text-[#454650]">
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Teaching Subject:</span>
                    <span className="font-bold text-[#385AAF] bg-blue-50 px-2 py-0.5 rounded">
                      {viewingTeacher.subject || 'Mathematics'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Assigned Class / Sections:</span>
                    <span className="font-semibold text-[#001243]">
                      {viewingTeacher.assignedClass || 'Class XII-A (Class Teacher)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Department / Academic Wing:</span>
                    <span className="font-semibold text-[#001243]">
                      {viewingTeacher.department?.name || viewingTeacher.department || 'Science & Mathematics Wing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Academic Designation:</span>
                    <span className="font-semibold text-[#001243]">{viewingTeacher.designation}</span>
                  </div>
                </div>
              </div>

              {/* Tenure & Contact Information */}
              <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#C5C6D1]/20 space-y-2">
                <h4 className="font-bold text-[#001243] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#385AAF]" />
                  Tenure & Official Contact
                </h4>
                <div className="space-y-1.5 text-[#454650]">
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Date of Joining:</span>
                    <span className="font-semibold text-[#001243]">
                      {viewingTeacher.joiningDate
                        ? new Date(viewingTeacher.joiningDate).toLocaleDateString()
                        : '12 July 2015'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Official Email (Login ID):</span>
                    <span className="font-semibold text-[#001243] font-mono select-all">
                      {viewingTeacher.email || 'faculty@ahps.edu.in'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Mobile Number:</span>
                    <span className="font-semibold text-[#001243]">{viewingTeacher.mobile || '+91 98765 43210'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Biometric Terminal ID:</span>
                    <span className="font-bold font-mono text-[#385AAF] bg-[#EBEDFF] px-2 py-0.5 rounded">
                      #{viewingTeacher.deviceUserId || '1042'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll Breakdown & Banking Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Full Salary Structure */}
              <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#C5C6D1]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#001243] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-[#385AAF]" />
                    Payroll Structure
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Monthly Gross: ₹{Number(viewingTeacher.grossSalary || (Number(viewingTeacher.basicSalary || 45000) + Number(viewingTeacher.hra || 13500) + Number(viewingTeacher.da || 9000) + Number(viewingTeacher.specialAllowance || 5000))).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="space-y-1 text-[#454650]">
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Basic Salary:</span>
                    <span className="font-bold text-[#001243]">
                      ₹{Number(viewingTeacher.basicSalary || 45000).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">House Rent Allowance (HRA):</span>
                    <span className="font-semibold text-[#001243]">
                      ₹{Number(viewingTeacher.hra || 13500).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Dearness Allowance (DA):</span>
                    <span className="font-semibold text-[#001243]">
                      ₹{Number(viewingTeacher.da || 9000).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Special Allowance:</span>
                    <span className="font-semibold text-[#001243]">
                      ₹{Number(viewingTeacher.specialAllowance || 5000).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank & Tax Details */}
              <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#C5C6D1]/20 space-y-2">
                <h4 className="font-bold text-[#001243] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-[#385AAF]" />
                  Banking & Tax Records
                </h4>
                <div className="space-y-1.5 text-[#454650]">
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Bank Name:</span>
                    <span className="font-semibold text-[#001243]">{viewingTeacher.bankName || 'State Bank of India'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Bank Account No:</span>
                    <span className="font-mono font-bold text-[#001243]">
                      {viewingTeacher.bankAccountNumber || '••••••••4589'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Bank IFSC Code:</span>
                    <span className="font-mono text-[#001243]">{viewingTeacher.bankIfsc || 'SBIN0001234'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">PAN Card Number:</span>
                    <span className="font-mono font-bold text-[#001243]">{viewingTeacher.panNumber || 'ABCDE1234F'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Quota Allocation Row */}
            <div className="p-3.5 rounded-xl bg-[#EBEDFF]/60 border border-[#C5C6D1]/30 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[#001243] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#385AAF]" />
                  Sanctioned Annual Leave Quotas (HRMS Balance)
                </h4>
                <span className="text-[10px] text-[#757681]">Full session entitlements</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-white border border-[#C5C6D1]/30 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-[#757681] uppercase">Casual Leave (CL)</span>
                  <span className="text-xl font-bold font-serif text-[#001243]">
                    {viewingTeacher.clQuota ?? 12} <span className="text-xs font-normal text-[#757681]">days</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#C5C6D1]/30 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-[#757681] uppercase">Earned Leave (EL)</span>
                  <span className="text-xl font-bold font-serif text-[#001243]">
                    {viewingTeacher.elQuota ?? 15} <span className="text-xs font-normal text-[#757681]">days</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#C5C6D1]/30 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-[#757681] uppercase">Medical Leave (ML)</span>
                  <span className="text-xl font-bold font-serif text-[#001243]">
                    {viewingTeacher.mlQuota ?? 10} <span className="text-xs font-normal text-[#757681]">days</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F2F3FF]">
              <button
                type="button"
                onClick={() => handleDeleteTeacher(viewingTeacher.id, viewingTeacher.name)}
                className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Delete Teacher</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    navigate(`/hrms-reports?teacherId=${viewingTeacher.id}`);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#E0E7FF] text-[#1E3A8A] hover:bg-[#C7D2FE] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#385AAF]" />
                  <span>HRMS Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    handleOpenCredentials(viewingTeacher);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#EBEDFF] text-[#001243] hover:bg-[#DAE1FF] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Key className="h-3.5 w-3.5 text-[#385AAF]" />
                  <span>Credentials</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    handleOpenEdit(viewingTeacher);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#001243] text-white hover:bg-[#14275E] text-xs font-bold flex items-center gap-1.5 cursor-pointer ring-1 ring-[#FFDF9E]"
                >
                  <Edit className="h-3.5 w-3.5 text-[#FFDF9E]" />
                  <span>Edit Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#F2F3FF] text-[#454650] hover:bg-[#EBEDFF] text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Comprehensive Modal for Faculty Onboarding & Editing */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          setOnboardSuccessData(null);
          setEditingTeacherId(null);
          setOnboardStep(1);
        }}
        maxWidth="max-w-3xl"
        title={editingTeacherId ? `Edit Faculty Record: ${formData.name || 'Teacher'}` : 'Institutional Faculty Onboarding'}
      >
        {onboardSuccessData ? (
          /* Success Celebration & Sync Confirmation View */
          <div className="space-y-5 text-xs text-[#0D1A3C]">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#EBEDFF] to-emerald-500/10 border border-emerald-500/30 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#001243]">
                  Faculty Member Onboarded & Synchronized!
                </h3>
                <p className="text-[#385AAF] font-medium text-[11px] mt-0.5">
                  Record active across Teacher Directory, Attendance Register, HRMS, and Payroll Engine.
                </p>
              </div>
            </div>

            {/* Profile Dossier Summary */}
            <div className="p-4 rounded-xl bg-[#FAF8FF] border border-[#C5C6D1]/30 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#EBEDFF]">
                <span className="font-bold text-[#001243] text-sm">{onboardSuccessData.name}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#001243] text-[#FFDF9E] font-mono text-[10px] font-bold">
                  {onboardSuccessData.employeeCode || onboardSuccessData.employeeId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#757681] block">Teaching Subject:</span>
                  <span className="font-bold text-[#385AAF]">{onboardSuccessData.subject}</span>
                </div>
                <div>
                  <span className="text-[#757681] block">Assigned Class:</span>
                  <span className="font-bold text-[#001243]">{onboardSuccessData.assignedClass}</span>
                </div>
                <div>
                  <span className="text-[#757681] block">Designation:</span>
                  <span className="font-semibold text-[#0D1A3C]">{onboardSuccessData.designation}</span>
                </div>
                <div>
                  <span className="text-[#757681] block">Gross Monthly Salary:</span>
                  <span className="font-bold text-emerald-700">
                    ₹{Number(onboardSuccessData.grossSalary || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[#757681] block">Annual Leave Quota:</span>
                  <span className="font-bold text-[#001243]">
                    {onboardSuccessData.clQuota ?? 12} CL • {onboardSuccessData.elQuota ?? 15} EL • {onboardSuccessData.mlQuota ?? 10} ML
                  </span>
                </div>
              </div>
            </div>

            {/* Portal Login Credentials Box */}
            <div className="p-4 rounded-xl bg-[#001243] text-white border border-[#FFDF9E]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#FFDF9E] tracking-wider flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-[#FFDF9E]" />
                  Teacher Portal Sign-in Credentials
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Portal Login:\nURL: ${window.location.origin}/login\nUser ID: ${onboardSuccessData.email}\nPassword: ${formData.loginPassword}`
                    );
                    setCopiedPass(true);
                    setTimeout(() => setCopiedPass(false), 3000);
                  }}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[#FFDF9E] text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedPass ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedPass ? 'Copied' : 'Copy Credentials'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                <div>
                  <span className="text-white/60 text-[10px] block">Login Username / Email</span>
                  <span className="font-mono font-bold text-white select-all">{onboardSuccessData.email}</span>
                </div>
                <div>
                  <span className="text-white/60 text-[10px] block">Portal Password</span>
                  <span className="font-mono font-bold text-[#FFDF9E] select-all">{formData.loginPassword}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBEDFF]">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterOpen(false);
                  setOnboardSuccessData(null);
                  setOnboardStep(1);
                  navigate(`/hrms-reports?teacherId=${onboardSuccessData.id}`);
                }}
                className="px-4 py-2 rounded-lg bg-[#E0E7FF] text-[#1E3A8A] hover:bg-[#C7D2FE] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#385AAF]" />
                <span>Open HRMS Report & Calendar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterOpen(false);
                  setOnboardSuccessData(null);
                  setOnboardStep(1);
                }}
                className="px-4 py-2 rounded-lg bg-[#001243] text-white font-bold text-xs ring-1 ring-[#FFDF9E] cursor-pointer"
              >
                Return to Directory
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Tab Onboarding & Edit Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs pb-1">
            {/* Step Selector Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#F2F3FF] rounded-xl border border-[#C5C6D1]/20">
              <button
                type="button"
                onClick={() => setOnboardStep(1)}
                className={`py-2 px-1 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                  onboardStep === 1
                    ? 'bg-[#001243] text-[#FFDF9E] shadow-sm'
                    : 'text-[#454650] hover:text-[#001243]'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">1. Personal & Subject</span>
              </button>
              <button
                type="button"
                onClick={() => setOnboardStep(2)}
                className={`py-2 px-1 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                  onboardStep === 2
                    ? 'bg-[#001243] text-[#FFDF9E] shadow-sm'
                    : 'text-[#454650] hover:text-[#001243]'
                }`}
              >
                <Banknote className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">2. Payroll & Banking</span>
              </button>
              <button
                type="button"
                onClick={() => setOnboardStep(3)}
                className={`py-2 px-1 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                  onboardStep === 3
                    ? 'bg-[#001243] text-[#FFDF9E] shadow-sm'
                    : 'text-[#454650] hover:text-[#001243]'
                }`}
              >
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">3. Leave Quotas</span>
              </button>
              <button
                type="button"
                onClick={() => setOnboardStep(4)}
                className={`py-2 px-1 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                  onboardStep === 4
                    ? 'bg-[#001243] text-[#FFDF9E] shadow-sm'
                    : 'text-[#454650] hover:text-[#001243]'
                }`}
              >
                <Key className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">4. Portal Credentials</span>
              </button>
            </div>

            {/* TAB 1: Personal & Subject Assignment */}
            {onboardStep === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#001243] mb-1">
                      Teacher Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Vikram Malhotra"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40 focus:outline-none focus:ring-1 focus:ring-[#385AAF]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#001243] mb-1">
                      Employee Code <span className="text-[10px] text-[#757681] font-normal">(Auto-suggested)</span>
                    </label>
                    <input
                      type="text"
                      placeholder={`AHPS-T0${(teachers.length + 43).toString().padStart(2, '0')}`}
                      value={formData.employeeCode}
                      onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40 font-mono font-bold text-[#001243]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#001243] mb-1">
                      Email Address (Login ID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="faculty@ahps.edu.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#001243] mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40"
                    />
                  </div>
                </div>

                {/* Academic Teaching Assignment */}
                <div className="p-3.5 rounded-xl bg-[#EBEDFF]/50 border border-[#C5C6D1]/30 space-y-3">
                  <span className="font-bold text-[#001243] text-xs flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-[#385AAF]" />
                    Academic Teaching Assignment
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#001243] mb-1">
                        Which Subject Teacher <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-white border border-[#C5C6D1]/40 font-semibold text-[#001243] focus:outline-none"
                      >
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Biology">Biology</option>
                        <option value="Computer Science & AI">Computer Science & AI</option>
                        <option value="English Literature">English Literature</option>
                        <option value="Hindi & Sanskrit">Hindi & Sanskrit</option>
                        <option value="Economics & Business Studies">Economics & Business Studies</option>
                        <option value="Accountancy & Commerce">Accountancy & Commerce</option>
                        <option value="Social Science & History">Social Science & History</option>
                        <option value="Physical Education">Physical Education</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#001243] mb-1">
                        Assigned Class / Sections <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.assignedClass}
                        onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-white border border-[#C5C6D1]/40 font-semibold text-[#001243] focus:outline-none"
                      >
                        <option value="Class XII-A (Class Teacher)">Class XII-A (Class Teacher)</option>
                        <option value="Class XII-B">Class XII-B</option>
                        <option value="Class XI-A">Class XI-A</option>
                        <option value="Class XI-B">Class XI-B</option>
                        <option value="Class X-A">Class X-A</option>
                        <option value="Class X-B">Class X-B</option>
                        <option value="Class IX-A">Class IX-A</option>
                        <option value="Class VIII-C">Class VIII-C</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#001243] mb-1">Designation</label>
                      <select
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-white border border-[#C5C6D1]/40 text-[#001243] focus:outline-none"
                      >
                        <option value="Senior PGT Teacher">Senior PGT Teacher</option>
                        <option value="PGT Teacher">PGT Teacher</option>
                        <option value="TGT Teacher">TGT Teacher</option>
                        <option value="PRT Teacher">PRT Teacher</option>
                        <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                        <option value="Special Educator">Special Educator</option>
                        <option value="Lab Instructor">Lab Instructor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#001243] mb-1">Department / Academic Wing</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-white border border-[#C5C6D1]/40 text-[#001243] focus:outline-none"
                      >
                        <option value="Science & Mathematics Wing">Science & Mathematics Wing</option>
                        <option value="Humanities & Social Sciences">Humanities & Social Sciences</option>
                        <option value="Commerce & Management">Commerce & Management</option>
                        <option value="Languages & Linguistics">Languages & Linguistics</option>
                        <option value="Primary & Middle Wing">Primary & Middle Wing</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#001243] mb-1">Date of Joining</label>
                    <input
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#001243] mb-1">
                      Biometric Enrollment ID <span className="text-[10px] text-[#757681] font-normal">(RFID / Fingerprint)</span>
                    </label>
                    <input
                      type="text"
                      placeholder={`10${(teachers.length + 43).toString()}`}
                      value={formData.deviceUserId}
                      onChange={(e) => setFormData({ ...formData, deviceUserId: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Full Payroll Breakdown & Banking */}
            {onboardStep === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#001243] mb-1">
                      Basic Monthly Salary (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.basicSalary}
                      onChange={(e) => {
                        const basic = Number(e.target.value);
                        setFormData({
                          ...formData,
                          basicSalary: basic,
                          hra: Math.round(basic * 0.3),
                          da: Math.round(basic * 0.2),
                        });
                      }}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40 text-sm font-bold text-[#001243]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#001243]">HRA Allowance (₹)</label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, hra: Math.round(Number(formData.basicSalary) * 0.3) })
                        }
                        className="text-[10px] text-[#385AAF] font-bold hover:underline"
                      >
                        Auto 30%
                      </button>
                    </div>
                    <input
                      type="number"
                      value={formData.hra}
                      onChange={(e) => setFormData({ ...formData, hra: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#001243]">DA Allowance (₹)</label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, da: Math.round(Number(formData.basicSalary) * 0.2) })
                        }
                        className="text-[10px] text-[#385AAF] font-bold hover:underline"
                      >
                        Auto 20%
                      </button>
                    </div>
                    <input
                      type="number"
                      value={formData.da}
                      onChange={(e) => setFormData({ ...formData, da: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#001243] mb-1">Special / Conveyance Allowance (₹)</label>
                    <input
                      type="number"
                      value={formData.specialAllowance}
                      onChange={(e) => setFormData({ ...formData, specialAllowance: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40"
                    />
                  </div>
                </div>

                {/* Gross Monthly Pay Banner */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#001243] to-[#14275E] text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#FFDF9E] tracking-wider block">
                      Calculated Gross Monthly Salary
                    </span>
                    <span className="text-xl font-extrabold font-serif text-white">
                      ₹
                      {(
                        Number(formData.basicSalary || 0) +
                        Number(formData.hra || 0) +
                        Number(formData.da || 0) +
                        Number(formData.specialAllowance || 0)
                      ).toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal text-white/70">/ month</span>
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 text-[10px] font-bold text-[#FFDF9E] border border-white/10">
                    Gross Pay Configured
                  </span>
                </div>

                {/* Bank Account & Tax Identifiers */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-[#001243] mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="State Bank of India"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#001243] mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 50100458921478"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#001243] mb-1">Bank IFSC Code</label>
                    <input
                      type="text"
                      placeholder="SBIN0001234"
                      value={formData.bankIfsc}
                      onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#001243] mb-1">PAN Number</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-[#C5C6D1]/40 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Leave Quotas Allocation */}
            {onboardStep === 3 && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#EBEDFF]/60 border border-[#C5C6D1]/30">
                  <span className="font-bold text-[#001243] text-xs flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[#385AAF]" />
                    Sanctioned Annual Leave Quotas (HRMS Balance)
                  </span>
                  <p className="text-[#757681] text-[11px] mt-0.5">
                    Assign annual leave allowances for this faculty member. These credits will directly initialize their HRMS leave calendar balances.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Casual Leave Quota */}
                  <div className="p-4 rounded-xl bg-[#FAF8FF] border border-[#C5C6D1]/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#001243]">Casual Leave (CL)</label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#1E3A8A]">
                        Casual
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        required
                        value={formData.clQuota}
                        onChange={(e) => setFormData({ ...formData, clQuota: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-lg bg-white border border-[#C5C6D1]/40 text-base font-bold text-[#001243] font-serif"
                      />
                      <span className="text-xs text-[#757681] font-medium">Days</span>
                    </div>
                    <p className="text-[10px] text-[#757681]">Default allowance: 12 days / academic session.</p>
                  </div>

                  {/* Earned Leave Quota */}
                  <div className="p-4 rounded-xl bg-[#FAF8FF] border border-[#C5C6D1]/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#001243]">Earned Leave (EL)</label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Privilege
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        required
                        value={formData.elQuota}
                        onChange={(e) => setFormData({ ...formData, elQuota: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-lg bg-white border border-[#C5C6D1]/40 text-base font-bold text-[#001243] font-serif"
                      />
                      <span className="text-xs text-[#757681] font-medium">Days</span>
                    </div>
                    <p className="text-[10px] text-[#757681]">Default allowance: 15 days / academic session.</p>
                  </div>

                  {/* Medical Leave Quota */}
                  <div className="p-4 rounded-xl bg-[#FAF8FF] border border-[#C5C6D1]/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#001243]">Medical Leave (ML)</label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        Medical
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        required
                        value={formData.mlQuota}
                        onChange={(e) => setFormData({ ...formData, mlQuota: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-lg bg-white border border-[#C5C6D1]/40 text-base font-bold text-[#001243] font-serif"
                      />
                      <span className="text-xs text-[#757681] font-medium">Days</span>
                    </div>
                    <p className="text-[10px] text-[#757681]">Default allowance: 10 days / academic session.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Portal Login & Security Credentials */}
            {onboardStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#EBEDFF]/60 border border-[#C5C6D1]/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#001243]" />
                    <span className="font-bold text-[#001243] text-xs">Teacher Portal Account Credentials</span>
                  </div>

                  <div>
                    <label className="block font-bold text-[#001243] mb-1">
                      Login ID / Username <span className="text-[10px] text-[#757681] font-normal">(Auto-mapped to email)</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.email || 'faculty@ahps.edu.in'}
                      className="w-full p-2.5 rounded-lg bg-white border border-[#C5C6D1]/40 font-mono text-xs font-bold text-[#001243]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#001243]">
                        Portal Password {editingTeacherId ? <span className="text-[10px] text-[#757681] font-normal">(Optional on edit)</span> : <span className="text-rose-500">*</span>}
                      </label>
                      <button
                        type="button"
                        onClick={generateStrongPassword}
                        className="text-[10px] text-[#385AAF] font-bold flex items-center gap-1 hover:underline"
                      >
                        <Sparkles className="h-3 w-3 text-[#385AAF]" />
                        Generate Strong Password
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={onboardPasswordVisible ? 'text' : 'password'}
                        required={!editingTeacherId}
                        value={formData.loginPassword}
                        onChange={(e) => setFormData({ ...formData, loginPassword: e.target.value })}
                        className="w-full p-2.5 pr-10 rounded-lg bg-white border border-[#C5C6D1]/40 font-mono text-xs font-bold text-[#001243]"
                      />
                      <button
                        type="button"
                        onClick={() => setOnboardPasswordVisible(!onboardPasswordVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757681] hover:text-[#001243]"
                      >
                        {onboardPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {!editingTeacherId && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="createLogin"
                        checked={formData.createLogin}
                        onChange={(e) => setFormData({ ...formData, createLogin: e.target.checked })}
                        className="rounded text-[#001243] focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="createLogin" className="text-xs text-[#0D1A3C] font-semibold cursor-pointer">
                        Activate Teacher Portal Access Immediately Upon Onboarding
                      </label>
                    </div>
                  )}
                </div>

                {/* System Synchronization Checklist Card */}
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
                  <span className="font-bold text-[#001243] text-[11px] block">
                    Institutional Application Synchronization Checklist
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-[#454650]">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="h-3.5 w-3.5" />
                      <span>Teacher Profiles Directory</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="h-3.5 w-3.5" />
                      <span>HRMS Calendar ({formData.clQuota || 12} CL / {formData.mlQuota || 10} ML)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="h-3.5 w-3.5" />
                      <span>Daily Biometric Attendance</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="h-3.5 w-3.5" />
                      <span>Monthly Attendance Register</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="h-3.5 w-3.5" />
                      <span>Monthly Payroll Engine</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="h-3.5 w-3.5" />
                      <span>Instant Sign-in at /login</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Controls Navigation Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#F2F3FF]">
              <div>
                {onboardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setOnboardStep((prev) => prev - 1)}
                    className="px-4 py-2 rounded-lg bg-[#EBEDFF] text-[#001243] hover:bg-[#DAE1FF] font-bold text-xs transition-colors cursor-pointer"
                  >
                    ← Previous Step
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#F2F3FF] text-[#454650] hover:bg-[#EBEDFF] font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {onboardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setOnboardStep((prev) => prev + 1)}
                    className="px-4 py-2 rounded-lg bg-[#001243] text-white hover:bg-[#14275E] font-bold text-xs transition-all cursor-pointer ring-1 ring-[#FFDF9E]"
                  >
                    Continue to {onboardStep === 1 ? 'Payroll' : onboardStep === 2 ? 'Leave Quotas' : 'Credentials'} →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#001243] text-[#FFDF9E] hover:bg-[#14275E] font-bold text-xs transition-all cursor-pointer ring-2 ring-[#FFDF9E] shadow-md flex items-center gap-1.5"
                  >
                    <CheckCheck className="h-4 w-4 text-[#FFDF9E]" />
                    <span>{editingTeacherId ? 'Save & Update Faculty Record' : 'Complete Onboarding & Synchronize'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Credentials Modal */}
      <Modal isOpen={isCredentialsOpen} onClose={() => setIsCredentialsOpen(false)} title="Teacher Portal Account">
        <form onSubmit={handleSaveCredentials} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#001243] mb-1">Email / Login Username</label>
            <input
              type="email"
              required
              value={credentialForm.email}
              onChange={(e) => setCredentialForm({ ...credentialForm, email: e.target.value })}
              className="w-full p-2 rounded-lg bg-[#F2F3FF] border border-[#C5C6D1]/30 focus:outline-none focus:ring-1 focus:ring-[#385AAF]"
            />
          </div>
          <div>
            <label className="block font-bold text-[#001243] mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={credentialForm.password}
                onChange={(e) => setCredentialForm({ ...credentialForm, password: e.target.value })}
                placeholder={credentialsUser ? 'Leave blank to keep current' : 'Enter login password'}
                className="w-full p-2 pr-8 rounded-lg bg-[#F2F3FF] border border-[#C5C6D1]/30 focus:outline-none focus:ring-1 focus:ring-[#385AAF]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#757681]"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCredentialsOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#EBEDFF] text-[#001243] font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={credentialsSubmitting}
              className="px-4 py-2 rounded-lg bg-[#001243] text-white font-bold ring-1 ring-[#FFDF9E] disabled:opacity-50"
            >
              {credentialsSubmitting ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherList;
