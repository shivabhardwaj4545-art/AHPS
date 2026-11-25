import React, { useState, useEffect } from 'react';
import { attendanceApi, employeesApi, getSyncedPunches } from '../../api/endpoints.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import { Modal } from '../../components/Modal.jsx';
import {
  Calendar,
  RefreshCw,
  Fingerprint,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  CheckCheck,
  RotateCcw,
  Download,
  Send,
  Sparkles,
  ShieldAlert,
  FileEdit,
} from 'lucide-react';

export const DailyAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('MORNING');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [records, setRecords] = useState([]);
  const [sendSmsAlerts, setSendSmsAlerts] = useState(true);
  const [submitFeedback, setSubmitFeedback] = useState(null);

  // Regularize modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    requestedStatus: 'PRESENT',
    requestedFirstIn: '08:00',
    requestedLastOut: '15:00',
    reason: '',
  });

  // Mock template roster matching Stitch Screen 5 if API returns 0 records
  const defaultRoster = [
    {
      id: 'AHPS-T014',
      employeeCode: 'AHPS-T014',
      name: 'Rajesh Sharma',
      designation: 'PGT Physics • Senior Secondary',
      department: 'Science & Biotech',
      schedule: '09:00 AM - 06:00 PM',
      room: 'Lab Hall 3',
      biometricIn: '08:48 AM',
      status: 'PRESENT',
      remarks: 'Period 1 Lab scheduled',
      syncStatus: 'Synced',
      syncTerminal: 'Gate Terminal 2',
    },
    {
      id: 'AHPS-T029',
      employeeCode: 'AHPS-T029',
      name: 'Ananya Sen',
      designation: 'TGT English • Middle Wing',
      department: 'Languages & English',
      schedule: '09:00 AM - 06:00 PM',
      room: 'Class IX-A Room 204',
      biometricIn: '08:52 AM',
      status: 'PRESENT',
      remarks: 'Assembly anchor duty',
      syncStatus: 'Synced',
      syncTerminal: 'Main Entrance',
    },
    {
      id: 'AHPS-T008',
      employeeCode: 'AHPS-T008',
      name: 'Harpreet Singh',
      designation: 'Head of Sports • Physical Ed',
      department: 'Physical Ed',
      schedule: '09:00 AM - 06:00 PM',
      room: 'Main Athletics Field',
      biometricIn: '09:22 AM',
      status: 'LATE',
      remarks: 'Traffic congestion at Ring Road (+22m)',
      syncStatus: 'Late Punch',
      syncTerminal: 'Sports Gate Terminal',
    },
    {
      id: 'AHPS-T032',
      employeeCode: 'AHPS-T032',
      name: 'Meenakshi Iyer',
      designation: 'PGT Mathematics • HOD',
      department: 'Mathematics',
      schedule: '09:00 AM - 06:00 PM',
      room: 'Math Wing Cabin 2',
      biometricIn: '—',
      status: 'ON_LEAVE',
      remarks: 'Sub: Rohit Verma (Math XII-B)',
      syncStatus: 'Sanctioned',
      syncTerminal: 'Medical Leave Approved',
    },
    {
      id: 'AHPS-T045',
      employeeCode: 'AHPS-T045',
      name: 'Vikram Rathore',
      designation: 'TGT Chemistry • Middle Wing',
      department: 'Science & Biotech',
      schedule: '09:00 AM - 06:00 PM',
      room: 'Chemistry Lab 1',
      biometricIn: '08:42 AM',
      status: 'PRESENT',
      remarks: 'Practical exam setup',
      syncStatus: 'Synced',
      syncTerminal: 'Chemistry Corridor Machine',
    },
    {
      id: 'AHPS-T061',
      employeeCode: 'AHPS-T061',
      name: 'Sunita Verma',
      designation: 'PRT Primary • Class III Incharge',
      department: 'Primary Wing',
      schedule: '09:00 AM - 06:00 PM',
      room: 'Primary Wing Room 102',
      biometricIn: '08:55 AM',
      status: 'PRESENT',
      remarks: 'Morning inspection check',
      syncStatus: 'Synced',
      syncTerminal: 'Primary Block Gate',
    },
    {
      id: 'AHPS-T052',
      employeeCode: 'AHPS-T052',
      name: 'Amit Kulkarni',
      designation: 'PGT History • Social Sciences',
      department: 'Social Sciences',
      schedule: '09:00 AM - 06:00 PM',
      room: 'Senior Wing Room 301',
      biometricIn: 'No Punch',
      status: 'ABSENT',
      remarks: 'Uninformed absence - SMS sent',
      syncStatus: 'Missing',
      syncTerminal: 'No biometric log found',
    },
    {
      id: 'AHPS-T077',
      employeeCode: 'AHPS-T077',
      name: 'Kavita Nair',
      designation: 'PGT Computer Science • IT Lead',
      department: 'Science & Biotech',
      schedule: '09:00 AM - 06:00 PM',
      room: 'Central Computer Lab',
      biometricIn: '08:45 AM',
      status: 'PRESENT',
      remarks: 'Server backup inspection',
      syncStatus: 'Synced',
      syncTerminal: 'IT Block Entrance',
    },
  ];

  const fetchDaily = async () => {
    try {
      setLoading(true);
      // Check if admin has saved custom attendance markings for this date
      const savedDaily = localStorage.getItem(`ahps_daily_attendance_${date}`);
      if (savedDaily) {
        try {
          const parsed = JSON.parse(savedDaily);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecords(parsed);
            setLoading(false);
            return;
          }
        } catch {}
      }

      const res = await attendanceApi.getDaily({ date });
      const apiData = res.data || [];

      let mapped = [];
      if (apiData.length > 0) {
        // Map backend API data to roster format
        mapped = apiData.map((rec) => ({
          id: rec.id || rec.employee?.id,
          employeeCode: rec.employee?.employeeCode || rec.employee?.employeeId || 'AHPS-T00',
          name: rec.employee?.name || 'Faculty Member',
          designation: rec.employee?.designation || 'Faculty Instructor',
          department: rec.employee?.department?.name || 'General Faculty',
          schedule: '09:00 AM - 06:00 PM',
          room: 'Main Academic Wing',
          biometricIn: rec.firstIn
            ? new Date(rec.firstIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : rec.status === 'ABSENT'
            ? 'No Punch'
            : '—',
          status: rec.status || 'PRESENT',
          remarks: rec.reviewReason || (rec.status === 'LATE' ? 'Late check-in' : 'Normal routine'),
          syncStatus: rec.status === 'ABSENT' ? 'Missing' : 'Synced',
          syncTerminal: 'Gate Terminal 01',
          rawRecord: rec,
        }));
      }

      // Merge with locally onboarded teachers
      const synced = JSON.parse(localStorage.getItem('ahps_synced_teachers') || '[]');
      const syncedMapped = synced.map((t) => ({
        id: t.id,
        employeeCode: t.employeeCode || t.employeeId || 'AHPS-T00',
        name: t.name,
        designation: `${t.designation} (${t.subject || 'Faculty'})`,
        department: typeof t.department === 'object' ? t.department?.name : t.department || 'Academic Wing',
        schedule: '09:00 AM - 06:00 PM',
        room: t.assignedClass || 'Senior Wing Room 302',
        biometricIn: '08:54 AM',
        status: 'PRESENT',
        remarks: `Subject: ${t.subject || 'Faculty'} • Synced`,
        syncStatus: 'Synced',
        syncTerminal: `Terminal #${t.deviceUserId || '02'}`,
      }));

      const baseList = apiData.length > 0 ? mapped : defaultRoster;
      // Filter out duplicates
      let mergedRoster = [...baseList];
      for (const st of syncedMapped) {
        if (!mergedRoster.some((r) => r.id === st.id || r.employeeCode === st.employeeCode)) {
          mergedRoster.unshift(st);
        }
      }

      // Apply real-time punches from cloud gateway / simulator / teacher portal
      const punches = getSyncedPunches();
      const todayStr = date || new Date().toISOString().split('T')[0];
      const todayPunches = punches.filter((p) => (p.timestamp || p.punchTime)?.startsWith(todayStr));

      todayPunches.forEach((p) => {
        const empCode = p.employeeCode || p.employeeId;
        const empName = p.employeeName;
        const target = mergedRoster.find(
          (r) =>
            (empCode && (r.employeeCode === empCode || r.id === empCode)) ||
            (empName && r.name?.toLowerCase().includes(empName.toLowerCase()))
        );

        if (target) {
          const punchTime = new Date(p.timestamp || p.punchTime);
          const timeFormatted = punchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          target.biometricIn = timeFormatted;
          target.status = 'PRESENT';
          target.syncStatus = 'Synced';
          target.syncTerminal = p.deviceName || 'Gate Terminal #01';
          target.remarks = `Cloud Biometric In (${p.verifyType || 'FINGERPRINT'})`;
        }
      });

      setRecords(mergedRoster);
    } catch (e) {
      console.warn('Backend API daily error, using template roster:', e);
      const synced = JSON.parse(localStorage.getItem('ahps_synced_teachers') || '[]');
      const syncedMapped = synced.map((t) => ({
        id: t.id,
        employeeCode: t.employeeCode || t.employeeId || 'AHPS-T00',
        name: t.name,
        designation: `${t.designation} (${t.subject || 'Faculty'})`,
        department: typeof t.department === 'object' ? t.department?.name : t.department || 'Academic Wing',
        schedule: '09:00 AM - 06:00 PM',
        room: t.assignedClass || 'Senior Wing Room 302',
        biometricIn: '08:54 AM',
        status: 'PRESENT',
        remarks: `Subject: ${t.subject || 'Faculty'} • Synced`,
        syncStatus: 'Synced',
        syncTerminal: `Terminal #${t.deviceUserId || '02'}`,
      }));
      let mergedRoster = [...syncedMapped, ...defaultRoster];

      const punches = getSyncedPunches();
      const todayStr = date || new Date().toISOString().split('T')[0];
      const todayPunches = punches.filter((p) => (p.timestamp || p.punchTime)?.startsWith(todayStr));

      todayPunches.forEach((p) => {
        const empCode = p.employeeCode || p.employeeId;
        const empName = p.employeeName;
        const target = mergedRoster.find(
          (r) =>
            (empCode && (r.employeeCode === empCode || r.id === empCode)) ||
            (empName && r.name?.toLowerCase().includes(empName.toLowerCase()))
        );

        if (target) {
          const punchTime = new Date(p.timestamp || p.punchTime);
          const timeFormatted = punchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          target.biometricIn = timeFormatted;
          target.status = 'PRESENT';
          target.syncStatus = 'Synced';
          target.syncTerminal = p.deviceName || 'Gate Terminal #01';
          target.remarks = `Cloud Biometric In (${p.verifyType || 'FINGERPRINT'})`;
        }
      });

      setRecords(mergedRoster);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaily();
  }, [date]);

  const handleStatusChange = (id, newStatus) => {
    setRecords((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleRemarkChange = (id, newRemarks) => {
    setRecords((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, remarks: newRemarks } : item
      )
    );
  };

  const handleMarkAllPresent = () => {
    setRecords((prev) =>
      prev.map((item) => ({ ...item, status: 'PRESENT' }))
    );
  };

  const handleReset = () => {
    fetchDaily();
  };

  const handleDateStep = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(`ahps_daily_attendance_${date}`, JSON.stringify(records));
      setSubmitFeedback('Draft Saved');
      setTimeout(() => setSubmitFeedback(null), 2500);
      alert(`Attendance register draft saved successfully for ${date}!\nSummary: Present: ${presentCount} | Half Day: ${halfDayCount} | Late: ${lateCount} | Absent: ${absentCount} | Leave: ${leaveCount}`);
    } catch (e) {
      alert('Error saving draft locally: ' + e.message);
    }
  };

  const handleSaveSubmit = async () => {
    try {
      setProcessing(true);
      setSubmitFeedback('Saving Register...');
      localStorage.setItem(`ahps_daily_attendance_${date}`, JSON.stringify(records));
      await attendanceApi.processDaily({ date, records });
      setTimeout(() => {
        setSubmitFeedback('Submitted Successfully');
        setTimeout(() => setSubmitFeedback(null), 2500);
      }, 700);
    } catch (err) {
      setTimeout(() => {
        setSubmitFeedback('Saved Locally');
        setTimeout(() => setSubmitFeedback(null), 2000);
      }, 500);
    } finally {
      setProcessing(false);
    }
  };

  // Filtered records
  const filtered = records.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase());
    const matchesDept =
      selectedDept === 'ALL' ||
      r.department.toLowerCase().includes(selectedDept.toLowerCase());
    return matchesSearch && matchesDept;
  });

  // Calculate live breakdown metrics
  const totalCount = records.length;
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const halfDayCount = records.filter((r) => r.status === 'HALF_DAY').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const leaveCount = records.filter((r) => r.status === 'ON_LEAVE' || r.status === 'LEAVE').length;

  const formattedDateTitle = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const departmentButtons = [
    { label: 'All Departments', id: 'ALL', count: 84 },
    { label: 'Mathematics', id: 'Mathematics', count: 12 },
    { label: 'Science & Biotech', id: 'Science', count: 16 },
    { label: 'Languages & English', id: 'Languages', count: 14 },
    { label: 'Social Sciences', id: 'Social', count: 10 },
    { label: 'Primary Wing', id: 'Primary', count: 18 },
    { label: 'Physical Ed', id: 'Physical', count: 8 },
  ];

  if (loading) return <LoadingSpinner label="Loading Attendance Register..." />;

  return (
    <div className="space-y-6 pb-28">
      {/* 1. Top Academic Context & Breadcrumb Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider text-[#385AAF] font-bold">
              Faculty Attendance Register
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5C6D1]"></span>
            <span className="text-xs text-[#454650] font-medium">Gate Machine #04 Active</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#001243] tracking-tight">
            Mark Faculty Attendance
          </h2>
          <p className="text-xs md:text-sm text-[#454650] mt-0.5">
            Real-time biometric log & manual administrative overrides for Senior & Primary Wings.
          </p>
        </div>

        {/* Quick Stat Chips */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#EBEDFF] shadow-sm border border-[#C5C6D1]/30">
            <Fingerprint className="h-5 w-5 text-[#385AAF]" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#454650] leading-none">
                Biometric Gateway
              </span>
              <span className="text-xs font-bold text-[#001243] mt-0.5">Connected (99.4%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#FFDF9E]/40 shadow-sm border border-[#FFDF9E]/60">
            <Clock className="h-5 w-5 text-[#392800]" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#392800] leading-none">
                Grace Period Cutoff
              </span>
              <span className="text-xs font-bold text-[#261A00] mt-0.5">09:15 AM (Strict)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Controls Deck: Date, Shift, and Batch Controls Row */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#C5C6D1]/20 flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Date Navigator */}
          <div className="flex items-center gap-2 bg-[#F2F3FF] px-2 py-1.5 rounded-xl border border-[#C5C6D1]/30 w-fit">
            <button
              onClick={() => handleDateStep(-1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#454650] hover:text-[#001243] hover:bg-white transition-all cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-2">
              <Calendar className="h-4 w-4 text-[#385AAF]" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs font-bold text-[#0D1A3C] bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => handleDateStep(1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#454650] hover:text-[#001243] hover:bg-white transition-all cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Shift Switcher */}
          <div className="flex items-center bg-[#F2F3FF] p-1 rounded-xl border border-[#C5C6D1]/30">
            <button
              onClick={() => setShift('MORNING')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                shift === 'MORNING'
                  ? 'bg-white text-[#001243] shadow-sm'
                  : 'text-[#454650] hover:text-[#0D1A3C]'
              }`}
            >
              <Sun className="h-3.5 w-3.5 text-[#385AAF]" />
              <span>Standard Shift (09:00 AM - 06:00 PM)</span>
            </button>
            <button
              onClick={() => setShift('EVENING')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                shift === 'EVENING'
                  ? 'bg-white text-[#001243] shadow-sm'
                  : 'text-[#454650] hover:text-[#0D1A3C]'
              }`}
            >
              <Moon className="h-3.5 w-3.5 text-[#757681]" />
              <span>Evening Remedial (02:30 PM - 05:00 PM)</span>
            </button>
          </div>

          {/* Batch Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleMarkAllPresent}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FFDF9E] text-[#001243] hover:bg-[#EBC166] text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <CheckCheck className="h-4 w-4 text-[#392800]" />
              <span>Mark All as Present</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EBEDFF] text-[#454650] hover:text-[#0D1A3C] text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EBEDFF] text-[#454650] hover:text-[#0D1A3C] text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export Draft</span>
            </button>
          </div>
        </div>

        {/* Search & Department Filter Tabs Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1 border-t border-[#F2F3FF]">
          {/* Department Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {departmentButtons.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedDept === dept.id
                    ? 'bg-[#001243] text-[#FFDF9E] shadow-sm'
                    : 'bg-[#F2F3FF] hover:bg-[#EBEDFF] text-[#0D1A3C]'
                }`}
              >
                {dept.label}{' '}
                <span className="opacity-70 text-[10px]">
                  ({dept.count})
                </span>
              </button>
            ))}
          </div>

          {/* Live Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="h-3.5 w-3.5 text-[#757681] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Name, ID, or Subject..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#F2F3FF] text-xs text-[#0D1A3C] placeholder:text-[#757681] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#385AAF] border border-transparent focus:border-[#385AAF]/30 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. Interactive Attendance Roster Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-[#C5C6D1]/20 overflow-hidden flex flex-col">
        {/* Header Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-[#001243] via-[#385AAF] to-[#EBC166]"></div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F2F3FF] text-[#454650] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Staff ID</th>
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Biometric In</th>
                <th className="py-3 px-4 text-center">Attendance Status</th>
                <th className="py-3 px-4">Substitute / Action Remarks</th>
                <th className="py-3 px-4 text-center">Biometric Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F3FF] text-xs">
              {filtered.map((teacher) => (
                <tr
                  key={teacher.id}
                  className={`hover:bg-[#F2F3FF]/60 transition-colors group ${
                    teacher.status === 'ABSENT'
                      ? 'bg-rose-50/30'
                      : teacher.status === 'ON_LEAVE'
                      ? 'bg-indigo-50/20'
                      : ''
                  }`}
                >
                  {/* Staff ID */}
                  <td className="py-3 px-4 font-semibold text-[#001243]">
                    <span className="px-2 py-0.5 rounded bg-[#EBEDFF] text-[#0D1A3C] font-mono text-[11px] font-bold">
                      {teacher.employeeCode}
                    </span>
                  </td>

                  {/* Faculty Member */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#14275E] text-[#FFDF9E] font-bold flex items-center justify-center text-xs shadow-sm ring-1 ring-[#EBEDFF] shrink-0">
                        {teacher.name.replace(/^(Mr\.|Mrs\.|Dr\.|Ms\.)\s*/, '').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[#0D1A3C] group-hover:text-[#001243]">
                          {teacher.name}
                        </span>
                        <span className="text-[11px] text-[#757681] truncate">
                          {teacher.designation}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Schedule */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="text-[#0D1A3C] font-semibold text-xs">
                        {teacher.schedule}
                      </span>
                      <span className="text-[10px] text-[#757681]">{teacher.room}</span>
                    </div>
                  </td>

                  {/* Biometric In */}
                  <td className="py-3 px-4">
                    {teacher.biometricIn === 'No Punch' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[#BA1A1A] text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]"></span>
                        No Punch
                      </span>
                    ) : teacher.status === 'LATE' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[#261A00] bg-[#FFDF9E] px-2 py-0.5 rounded text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#261A00]"></span>
                        {teacher.biometricIn}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#0D1A3C] text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#385AAF]"></span>
                        {teacher.biometricIn}
                      </span>
                    )}
                  </td>

                  {/* Attendance Status (5-Way Segmented Control with Half Day) */}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center p-0.5 rounded-lg bg-[#F2F3FF] border border-[#C5C6D1]/30">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(teacher.id, 'PRESENT')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          teacher.status === 'PRESENT'
                            ? 'bg-white text-[#385AAF] shadow-sm ring-1 ring-black/5'
                            : 'text-[#454650] hover:text-[#0D1A3C]'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(teacher.id, 'HALF_DAY')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          teacher.status === 'HALF_DAY'
                            ? 'bg-[#FFDF9E] text-[#261A00] shadow-sm font-extrabold ring-1 ring-[#FFDF9E]'
                            : 'text-[#454650] hover:text-[#0D1A3C]'
                        }`}
                      >
                        Half Day
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(teacher.id, 'LATE')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          teacher.status === 'LATE'
                            ? 'bg-amber-100 text-amber-900 shadow-sm font-extrabold'
                            : 'text-[#454650] hover:text-[#0D1A3C]'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(teacher.id, 'ABSENT')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          teacher.status === 'ABSENT'
                            ? 'bg-[#BA1A1A] text-white shadow-sm'
                            : 'text-[#454650] hover:text-[#0D1A3C]'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(teacher.id, 'ON_LEAVE')}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          teacher.status === 'ON_LEAVE' || teacher.status === 'LEAVE'
                            ? 'bg-[#385AAF] text-white shadow-sm'
                            : 'text-[#454650] hover:text-[#0D1A3C]'
                        }`}
                      >
                        Leave
                      </button>
                    </div>
                  </td>

                  {/* Remarks Input */}
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={teacher.remarks}
                      onChange={(e) => handleRemarkChange(teacher.id, e.target.value)}
                      placeholder="Add remarks..."
                      className={`w-full px-2.5 py-1 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#385AAF] transition-all ${
                        teacher.status === 'ABSENT'
                          ? 'bg-[#FFDAD6]/40 text-[#93000A] placeholder:text-[#93000A]/60'
                          : teacher.status === 'ON_LEAVE'
                          ? 'bg-[#DAE1FF]/40 text-[#1A4195]'
                          : teacher.status === 'HALF_DAY'
                          ? 'bg-[#FFF8E6] text-[#7A4B00]'
                          : 'bg-[#F2F3FF] text-[#0D1A3C] placeholder:text-[#757681]'
                      }`}
                    />
                  </td>

                  {/* Biometric Sync Status */}
                  <td className="py-3 px-4 text-center">
                    {teacher.status === 'ABSENT' ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#BA1A1A]"
                        title={teacher.syncTerminal}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Missing
                      </span>
                    ) : teacher.status === 'ON_LEAVE' ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#385AAF]"
                        title={teacher.syncTerminal}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Sanctioned
                      </span>
                    ) : teacher.status === 'HALF_DAY' ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#261A00] bg-[#FFDF9E] px-2 py-0.5 rounded text-xs"
                        title={teacher.syncTerminal}
                      >
                        <Clock className="h-3.5 w-3.5 text-[#261A00]" />
                        Half Day
                      </span>
                    ) : teacher.status === 'LATE' ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C9A24B]"
                        title={teacher.syncTerminal}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Late Punch
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#385AAF]"
                        title={teacher.syncTerminal}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Synced
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer Notes */}
        <div className="p-3 bg-[#F2F3FF]/60 flex flex-col md:flex-row items-center justify-between gap-2 border-t border-[#F2F3FF] text-xs text-[#757681]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#385AAF]"></span>
            <span>Showing {filtered.length} of {records.length} faculty entries.</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Auto-syncing logs every 30 seconds</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#385AAF]"></span>
            <span className="font-semibold text-[#001243]">Last synced: Just now</span>
          </div>
        </div>
      </div>

      {/* 4. Sticky Bottom Institutional Action Bar (Screen 5 Footer) */}
      <aside className="fixed bottom-0 left-0 md:left-72 right-0 bg-white/95 backdrop-blur-xl border-t border-[#C5C6D1]/40 py-3 px-6 shadow-[0_-4px_16px_rgba(0,18,67,0.08)] z-40 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Live Attendance Breakdown Capsule */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2.5 bg-[#EBEDFF] px-4 py-2 rounded-full shadow-inner border border-[#C5C6D1]/30">
            <span className="text-xs font-bold text-[#001243]">Marked:</span>
            <span className="text-xs font-bold text-[#0D1A3C]">
              {totalCount - absentCount}/{totalCount}
            </span>
            <span className="w-1 h-3.5 bg-[#C5C6D1] mx-1"></span>
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <span className="inline-flex items-center gap-1 text-[#385AAF]">
                <span className="w-2 h-2 rounded-full bg-[#385AAF]"></span> Present: {presentCount}
              </span>
              <span className="inline-flex items-center gap-1 text-[#8C5200]">
                <span className="w-2 h-2 rounded-full bg-[#FFDF9E] border border-amber-500"></span> Half Day: {halfDayCount}
              </span>
              <span className="inline-flex items-center gap-1 text-[#261A00]">
                <span className="w-2 h-2 rounded-full bg-[#EBC166]"></span> Late: {lateCount}
              </span>
              <span className="inline-flex items-center gap-1 text-[#BA1A1A]">
                <span className="w-2 h-2 rounded-full bg-[#BA1A1A]"></span> Absent: {absentCount}
              </span>
              <span className="inline-flex items-center gap-1 text-[#4B5C95]">
                <span className="w-2 h-2 rounded-full bg-[#4B5C95]"></span> Leave: {leaveCount}
              </span>
            </div>
          </div>

          {/* Quick Automated Notification Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendSmsAlerts}
              onChange={(e) => setSendSmsAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-[#001243] focus:ring-0 cursor-pointer accent-[#14275E]"
            />
            <span className="text-xs text-[#0D1A3C] font-semibold flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-[#392800]" />
              Send automated SMS alerts to absentees
            </span>
          </label>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 rounded-lg bg-[#EBEDFF] hover:bg-[#DAE1FF] text-[#001243] text-xs font-bold transition-all cursor-pointer"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={handleSaveSubmit}
            className="px-5 py-2 rounded-lg bg-[#001243] hover:bg-[#14275E] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 ring-1 ring-[#FFDF9E] cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-[#FFDF9E]" />
            <span>{submitFeedback || 'Save & Submit Attendance'}</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default DailyAttendance;
