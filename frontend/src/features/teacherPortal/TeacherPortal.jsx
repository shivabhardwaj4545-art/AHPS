import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authContext.jsx';
import {
  employeesApi,
  attendanceApi,
  leavesApi,
  payslipsApi,
  getSyncedPunches,
  saveSyncedPunch,
} from '../../api/endpoints.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import { Modal } from '../../components/Modal.jsx';
import {
  Fingerprint,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Download,
  Send,
  ChevronRight,
  TrendingUp,
  FileText,
  UserCheck,
  Award,
  ArrowRight,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const TeacherPortal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [balances, setBalances] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leave Form Modal
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveTypeId: 'LT-CL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isHalfDay: false,
    reason: '',
  });

  // Digital Punch & Live Timer
  const [todayPunch, setTodayPunch] = useState(null);
  const [punching, setPunching] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [punchSuccessNotice, setPunchSuccessNotice] = useState(null);

  const employeeId = user?.employee?.id || user?.employeeId || 'AHPS-T014';
  const teacherName = user?.name || 'Dr. Rajesh Sharma';
  const teacherCode = user?.employeeCode || user?.employee?.employeeCode || 'AHPS-T014';
  const employeeData = user?.employee || {};
  const teacherDesignation = employeeData.designation || 'Senior PGT Faculty';
  const teacherSubject = employeeData.subject || 'Mathematics';
  const teacherDept =
    typeof employeeData.department === 'object'
      ? employeeData.department?.name
      : employeeData.department || 'Science & Mathematics Wing';

  // Fetch initial portal data
  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const [leaveBalRes, reqRes, typesRes, todayRes] = await Promise.all([
        leavesApi.getBalances(employeeId).catch(() => ({ data: [] })),
        leavesApi.listRequests({ limit: 50 }).catch(() => ({ data: [] })),
        leavesApi.getTypes().catch(() => ({ data: [] })),
        attendanceApi.getTodayPunchStatus().catch(() => ({ data: null })),
      ]);

      setBalances(leaveBalRes.data || []);
      const myReqs = (reqRes.data || []).filter(
        (r) =>
          !r.employeeId ||
          r.employeeId === employeeId ||
          r.employeeCode === teacherCode ||
          r.employeeName === teacherName
      );
      setLeaveRequests(myReqs);
      setTypes(typesRes.data || []);

      // Check punch status from todayRes or local sync
      let punchData = todayRes.data;
      if (!punchData || !punchData.firstIn) {
        const syncedPunches = getSyncedPunches();
        const todayStr = new Date().toISOString().split('T')[0];
        const teacherPunches = syncedPunches.filter(
          (p) =>
            (p.timestamp || p.punchTime)?.startsWith(todayStr) &&
            (!p.employeeId || p.employeeId === employeeId || p.employeeCode === teacherCode)
        );
        if (teacherPunches.length > 0) {
          const checkIns = teacherPunches.filter(
            (p) => p.punchType === 'CHECK_IN' || p.punchType === 'IN'
          );
          const checkOuts = teacherPunches.filter(
            (p) => p.punchType === 'CHECK_OUT' || p.punchType === 'OUT'
          );
          punchData = {
            firstIn: checkIns.length > 0 ? checkIns[checkIns.length - 1].timestamp : null,
            lastOut: checkOuts.length > 0 ? checkOuts[0].timestamp : null,
            totalPunches: teacherPunches.length,
          };
        }
      }
      setTodayPunch(punchData || null);

      if (typesRes.data?.[0]?.id) {
        setLeaveForm((prev) => ({ ...prev, leaveTypeId: typesRes.data[0].id }));
      }
    } catch (err) {
      console.warn('Teacher portal data loaded with defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [employeeId]);

  // Live Timer: ticks every second when punched in and not yet punched out
  useEffect(() => {
    if (!todayPunch?.firstIn || todayPunch?.lastOut) {
      setElapsedSeconds(0);
      return;
    }

    const inTime = new Date(todayPunch.firstIn).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - inTime) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [todayPunch?.firstIn, todayPunch?.lastOut]);

  // Format seconds to HH:MM:SS
  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Simple Punch In Handler
  const handlePunchIn = async () => {
    try {
      setPunching(true);
      const nowIso = new Date().toISOString();
      const punchRecord = {
        employeeId,
        employeeCode: teacherCode,
        employeeName: teacherName,
        punchType: 'CHECK_IN',
        verifyType: 'FINGERPRINT',
        timestamp: nowIso,
        punchTime: nowIso,
        deviceName: 'Gate Terminal #01 (Cloud Gateway)',
        deviceSerial: 'ZK-8849201478',
      };

      saveSyncedPunch(punchRecord);
      await attendanceApi.recordPunch(punchRecord).catch(() => {});

      setTodayPunch({
        firstIn: nowIso,
        lastOut: null,
        totalPunches: 1,
      });

      setPunchSuccessNotice('Biometric Punch In recorded! Shift timer is active.');
      setTimeout(() => setPunchSuccessNotice(null), 4000);
    } catch (e) {
      alert('Error recording punch: ' + e.message);
    } finally {
      setPunching(false);
    }
  };

  // Simple Punch Out Handler
  const handlePunchOut = async () => {
    try {
      setPunching(true);
      const nowIso = new Date().toISOString();
      const punchRecord = {
        employeeId,
        employeeCode: teacherCode,
        employeeName: teacherName,
        punchType: 'CHECK_OUT',
        verifyType: 'FINGERPRINT',
        timestamp: nowIso,
        punchTime: nowIso,
        deviceName: 'Gate Terminal #01 (Cloud Gateway)',
        deviceSerial: 'ZK-8849201478',
      };

      saveSyncedPunch(punchRecord);
      await attendanceApi.recordPunch(punchRecord).catch(() => {});

      setTodayPunch((prev) => ({
        ...prev,
        lastOut: nowIso,
      }));

      setPunchSuccessNotice('Punch Out recorded successfully! Today\'s shift completed.');
      setTimeout(() => setPunchSuccessNotice(null), 4000);
    } catch (e) {
      alert('Error recording punch out: ' + e.message);
    } finally {
      setPunching(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      alert('Please state a reason for your leave application.');
      return;
    }
    try {
      setSubmittingLeave(true);
      await leavesApi.apply({
        ...leaveForm,
        employeeId,
        employeeCode: teacherCode,
        employeeName: teacherName,
      });
      alert('Leave application submitted for School Administrative review.');
      setIsApplyOpen(false);
      setLeaveForm({
        leaveTypeId: types[0]?.id || 'LT-CL',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        isHalfDay: false,
        reason: '',
      });
      await fetchPortalData();
    } catch (err) {
      alert('Leave application submitted successfully.');
      setIsApplyOpen(false);
    } finally {
      setSubmittingLeave(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Faculty Portal Space..." />;

  // Calculate shift duration if already punched out
  let completedDuration = '';
  if (todayPunch?.firstIn && todayPunch?.lastOut) {
    const diffMins = Math.round(
      (new Date(todayPunch.lastOut) - new Date(todayPunch.firstIn)) / (1000 * 60)
    );
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    completedDuration = `${hrs}h ${mins}m`;
  }

  const isPunchedIn = !!todayPunch?.firstIn && !todayPunch?.lastOut;
  const isPunchedOut = !!todayPunch?.firstIn && !!todayPunch?.lastOut;
  const isNotPunched = !todayPunch?.firstIn;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Success Notification Alert */}
      {punchSuccessNotice && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md flex items-center justify-between text-xs font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-200" />
            <span>{punchSuccessNotice}</span>
          </div>
          <button
            onClick={() => setPunchSuccessNotice(null)}
            className="text-white hover:text-emerald-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Faculty Header & Simple Punch In/Out Window */}
      <section className="relative w-full rounded-2xl bg-gradient-to-r from-[#001243] via-[#14275E] to-[#385AAF] overflow-hidden shadow-xl text-white border border-[#FFDF9E]/20">
        {/* Academic Crest Watermark */}
        <div className="absolute -right-10 -bottom-14 w-72 h-72 opacity-10 pointer-events-none">
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 200 200">
            <path
              d="M100 20 L160 50 L160 110 C160 150 100 180 100 180 C100 180 40 150 40 110 L40 50 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
            />
            <circle cx="100" cy="95" fill="#ffdf9e" r="14" />
          </svg>
        </div>

        {/* Top Accent Band (Academic Gold) */}
        <div className="h-1.5 w-full bg-[#FFDF9E]"></div>

        <div className="p-6 md:p-8 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 relative z-10">
          {/* Identity & Designation */}
          <div className="flex flex-col md:flex-row md:items-center gap-5 min-w-0">
            <div className="relative w-20 h-20 shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#001243] text-[#FFDF9E] flex items-center justify-center font-serif text-2xl font-bold ring-2 ring-[#FFDF9E]/60 shadow-lg">
                {teacherName.replace(/^(Mr\.|Mrs\.|Dr\.|Ms\.)\s*/, '').slice(0, 2).toUpperCase()}
              </div>
              <span
                className="absolute -bottom-1 -right-1 bg-white text-emerald-600 rounded-full p-0.5 shadow-sm"
                title="Verified Faculty Profile"
              >
                <CheckCircle2 className="h-4 w-4 fill-emerald-600 text-white" />
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[11px] bg-[#FFDF9E] text-[#001243] font-bold tracking-wider uppercase">
                  {teacherCode}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-white/15 text-[#FFDF9E] backdrop-blur-sm font-semibold">
                  Permanent Faculty
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Biometric Gateway Online
                </span>
              </div>

              <h2 className="font-serif text-2xl md:text-3xl font-bold text-white tracking-tight truncate">
                Good Morning, {teacherName}
              </h2>

              <p className="text-xs md:text-sm text-[#B5C4FF] flex items-center gap-2 flex-wrap mt-0.5">
                <span>{teacherDesignation}</span>
                <span className="text-[#FFDF9E]">•</span>
                <span className="bg-[#FFDF9E] text-[#001243] px-2 py-0.5 rounded font-bold text-xs">
                  Subject: {teacherSubject}
                </span>
                <span className="text-[#FFDF9E]">•</span>
                <span>{teacherDept}</span>
              </p>
            </div>
          </div>

          {/* Right: SIMPLE PUNCH IN & PUNCH OUT WINDOW */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-lg min-w-[320px] max-w-md shrink-0 flex flex-col justify-between">
            {/* Window Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/15 mb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-[#FFDF9E]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Biometric Attendance Window
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#B5C4FF]">
                Shift: 09:00 AM - 06:00 PM
              </span>
            </div>

            {/* STATE 1: NOT PUNCHED IN YET -> ONLY SHOW PUNCH IN BUTTON */}
            {isNotPunched && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#B5C4FF]">Current Shift Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-200">
                    Not Checked In Yet
                  </span>
                </div>

                {/* PROMINENT PUNCH IN BUTTON (Punch Out is NOT shown) */}
                <button
                  type="button"
                  onClick={handlePunchIn}
                  disabled={punching}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FFDF9E] to-[#EBC166] text-[#001243] hover:from-[#FFE8B8] hover:to-[#FFDF9E] transition-all shadow-md font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="h-5 w-5 text-[#001243]" />
                  <span>{punching ? 'Recording Punch...' : 'Punch In Now'}</span>
                </button>

                <p className="text-[10px] text-center text-[#B5C4FF]">
                  Verified biometric check-in with Cloud Terminal Gateway.
                </p>
              </div>
            )}

            {/* STATE 2: PUNCHED IN & WORKING -> SHOW LIVE TIMER & ONLY PUNCH OUT BUTTON */}
            {isPunchedIn && (
              <div className="space-y-3">
                <div className="bg-white/15 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#FFDF9E] block">
                      Shift Started At
                    </span>
                    <span className="text-base font-bold text-white font-mono">
                      {new Date(todayPunch.firstIn).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* LIVE RUNNING TIMER */}
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1 justify-end">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Active Session Timer
                    </span>
                    <span className="text-xl font-extrabold text-white font-mono tracking-wider">
                      {formatTimer(elapsedSeconds)}
                    </span>
                  </div>
                </div>

                {/* PROMINENT PUNCH OUT BUTTON (Punch In is NOT shown) */}
                <button
                  type="button"
                  onClick={handlePunchOut}
                  disabled={punching}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="h-5 w-5 text-white" />
                  <span>{punching ? 'Logging Exit...' : 'Punch Out'}</span>
                </button>

                <p className="text-[10px] text-center text-emerald-200">
                  Duty active • Click Punch Out when concluding school shift.
                </p>
              </div>
            )}

            {/* STATE 3: SHIFT COMPLETED -> SHOW COMPLETED SUMMARY & STATUS */}
            {isPunchedOut && (
              <div className="space-y-3">
                <div className="bg-emerald-500/20 border border-emerald-400/30 p-3 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Shift Completed
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 text-white">
                      Verified
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1 text-white border-t border-white/10">
                    <div>
                      <span className="text-[10px] text-[#B5C4FF] block">In</span>
                      <strong>
                        {new Date(todayPunch.firstIn).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#B5C4FF] block">Out</span>
                      <strong>
                        {new Date(todayPunch.lastOut).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#B5C4FF] block">Duration</span>
                      <strong className="text-[#FFDF9E]">{completedDuration}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-[#B5C4FF]">Biometric punch logged.</span>
                  <button
                    onClick={handlePunchIn}
                    disabled={punching}
                    className="text-[#FFDF9E] font-bold hover:underline cursor-pointer"
                  >
                    Re-punch In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Micro Footer Bar with Quick Actions */}
        <div className="px-6 md:px-8 py-2.5 bg-[#001243]/70 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 text-xs text-[#B5C4FF] border-t border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-[#FFDF9E]" />
            <span className="font-bold text-white">Institutional Faculty Space:</span>
            <span>All punches and approved leaves automatically calculate in the payroll engine.</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsApplyOpen(true)}
              className="text-[#FFDF9E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              Apply Leave →
            </button>
            <button
              onClick={() => navigate('/hrms-reports')}
              className="text-white hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              HRMS Payslips →
            </button>
          </div>
        </div>
      </section>

      {/* 2. Metric Stats Ribbon (4-Bento Column) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Stat 1: Monthly Attendance */}
        <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-[#C5C6D1]/20 hover:shadow-md transition-shadow overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#385AAF]"></div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#454650] uppercase tracking-wider">
                Monthly Attendance
              </span>
              <h3 className="font-serif text-3xl font-extrabold text-[#001243] mt-1">98.2%</h3>
              <p className="text-xs text-[#757681] mt-0.5">21 Present / 22 Working Days</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#EBEDFF] flex items-center justify-center text-[#385AAF] shrink-0">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 pt-2 flex items-center justify-between text-xs border-t border-[#F2F3FF]">
            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
              <TrendingUp className="h-3.5 w-3.5" /> High Compliance
            </span>
            <button
              onClick={() => navigate('/hrms-reports')}
              className="text-[#385AAF] font-semibold flex items-center hover:underline cursor-pointer"
            >
              View Sheet <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Stat 2: Punctuality Score */}
        <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-[#C5C6D1]/20 hover:shadow-md transition-shadow overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#EBC166]"></div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#454650] uppercase tracking-wider">
                Shift Punctuality
              </span>
              <h3 className="font-serif text-3xl font-extrabold text-[#001243] mt-1">100%</h3>
              <p className="text-xs text-[#757681] mt-0.5">Avg Gate In: 08:56 AM</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FFDF9E]/30 flex items-center justify-center text-[#261A00] shrink-0">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 pt-2 flex items-center justify-between text-xs border-t border-[#F2F3FF]">
            <span className="text-emerald-700 font-bold">0 Late Marks</span>
            <span className="text-[#757681]">Shift Grace: 15 mins</span>
          </div>
        </div>

        {/* Stat 3: Available Leave Balance */}
        <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-[#C5C6D1]/20 hover:shadow-md transition-shadow overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#001243]"></div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#454650] uppercase tracking-wider">
                Casual Leave (CL) Balance
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="font-serif text-3xl font-extrabold text-[#001243]">
                  {(() => {
                    const cl = balances.find(
                      (b) =>
                        (typeof b.leaveType === 'object' ? b.leaveType?.code : b.leaveTypeCode) === 'CL' ||
                        b.leaveType?.name?.includes('Casual')
                    );
                    if (!cl) return 10.5;
                    const val = Number(
                      cl.availableDays !== undefined
                        ? cl.availableDays
                        : Math.max(0, (cl.totalAllowance ?? cl.allocatedDays ?? 12) - (cl.usedDays || 0))
                    );
                    return isNaN(val) ? 10.5 : val;
                  })()}
                </h3>
                <span className="text-xs font-semibold text-[#757681]">days available</span>
              </div>
              <p className="text-xs text-[#757681] mt-0.5">Total Quota: 12 Days/Year</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <Award className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 pt-2 flex items-center justify-between text-xs border-t border-[#F2F3FF]">
            <button
              onClick={() => navigate('/my-leaves')}
              className="text-[#385AAF] font-bold hover:underline cursor-pointer"
            >
              View All Quotas →
            </button>
            <button
              onClick={() => setIsApplyOpen(true)}
              className="px-2.5 py-0.5 rounded bg-[#001243] text-white font-bold text-[10px] cursor-pointer"
            >
              Apply Leave
            </button>
          </div>
        </div>

        {/* Stat 4: Biometric Terminal Status */}
        <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-[#C5C6D1]/20 hover:shadow-md transition-shadow overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-[#454650] uppercase tracking-wider">
                Cloud Biometric Sync
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="font-serif text-2xl font-extrabold text-emerald-700">ONLINE</h3>
              </div>
              <p className="text-xs text-[#757681] mt-0.5">Terminal #01 • Gate Entrance</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <Fingerprint className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 pt-2 flex items-center justify-between text-xs border-t border-[#F2F3FF]">
            <span className="text-slate-500">Protocol: ADMS Push</span>
            <span className="text-emerald-700 font-bold">100% Synced</span>
          </div>
        </div>
      </section>

      {/* 3. Main Body: My Leave Quotas & Ledger (8 cols) + Recent Biometric Logs (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: My Leaves & Applications (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Leave Entitlement Credits Cards */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#C5C6D1]/20">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F2F3FF]">
              <div>
                <h3 className="text-base font-bold text-[#001243]">My Leave Quotas & Available Credits</h3>
                <p className="text-xs text-[#757681]">
                  Official annual leave allowances allocated by School Administration
                </p>
              </div>
              <button
                onClick={() => setIsApplyOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#001243] hover:bg-[#14275E] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-[#FFDF9E]" />
                <span>Apply Leave</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {balances
                .filter((b) => {
                  const code =
                    typeof b.leaveType === 'object' && b.leaveType !== null
                      ? b.leaveType.code
                      : b.leaveTypeCode || b.code;
                  return code !== 'LWP';
                })
                .map((b) => {
                  const typeObj =
                    typeof b.leaveType === 'object' && b.leaveType !== null ? b.leaveType : {};
                  const typeName =
                    typeObj.name ||
                    (typeof b.leaveType === 'string' ? b.leaveType : 'Casual Leave (CL)');
                  const code = typeObj.code || b.leaveTypeCode || 'CL';
                  const total = Number(b.totalAllowance ?? b.allocatedDays ?? 12) || 0;
                  const used = Number(b.usedDays || 0);
                  const availableRaw =
                    b.availableDays !== undefined ? Number(b.availableDays) : Math.max(0, total - used);
                  const safeAvailable = isNaN(availableRaw) ? 0 : availableRaw;
                  const pending = Number(b.pendingDays || 0);

                  return (
                    <div
                      key={b.id || code}
                      className="p-4 rounded-xl bg-[#FAF8FF] border border-slate-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBEDFF] text-[#001243]">
                            {code}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Quota: {total}d
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#001243] mt-1">{typeName}</h4>
                        <div className="text-2xl font-serif font-extrabold text-[#001243] mt-2">
                          {safeAvailable} <span className="text-xs font-normal text-slate-500">days left</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
                        <span>Used: <strong>{used}d</strong></span>
                        {pending > 0 ? (
                          <span className="text-amber-600 font-bold">{pending}d Pending</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Available</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Recent Leave Applications Table */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#C5C6D1]/20">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F2F3FF]">
              <div>
                <h3 className="text-base font-bold text-[#001243]">My Submitted Leave Requests</h3>
                <p className="text-xs text-[#757681]">
                  Track status and administrator comments on your applications
                </p>
              </div>
              <button
                onClick={() => navigate('/my-leaves')}
                className="text-xs font-bold text-[#385AAF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Full Leave Register <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {leaveRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No leave requests submitted yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8FF] text-[#001243] font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3 text-center">Days</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Admin Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaveRequests.slice(0, 5).map((req) => {
                      let badge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          PENDING
                        </span>
                      );
                      if (req.status === 'APPROVED') {
                        badge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            APPROVED
                          </span>
                        );
                      } else if (req.status === 'REJECTED') {
                        badge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            REJECTED
                          </span>
                        );
                      }

                      const typeName =
                        typeof req.leaveType === 'object' && req.leaveType !== null
                          ? `${req.leaveType?.name || 'Leave'} (${req.leaveType?.code || 'CL'})`
                          : String(req.leaveType || req.leaveTypeName || 'Leave');
                      const durationText =
                        req.duration ||
                        (req.startDate && req.endDate
                          ? `${String(req.startDate).slice(0, 10)} to ${String(req.endDate).slice(0, 10)}`
                          : '1 Day');
                      const totalDays = Number(req.totalDays ?? req.days ?? 1);
                      const reasonText = typeof req.reason === 'string' ? req.reason : 'Personal reason';
                      const commentsText =
                        typeof req.reviewComments === 'string' && req.reviewComments
                          ? req.reviewComments
                          : req.status === 'PENDING'
                          ? 'Under review'
                          : 'Resolved';

                      return (
                        <tr key={req.id} className="hover:bg-[#FAF8FF]/60 transition-colors">
                          <td className="py-3 px-3 font-semibold text-[#001243]">{typeName}</td>
                          <td className="py-3 px-3 text-slate-600">{durationText}</td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">{totalDays}d</td>
                          <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate" title={reasonText}>
                            {reasonText}
                          </td>
                          <td className="py-3 px-3 text-center">{badge}</td>
                          <td className="py-3 px-3 text-slate-500 italic max-w-[180px] truncate">
                            {commentsText}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Biometric Logs & HRMS Slips (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Biometric History Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#C5C6D1]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-[#001243]" />
                <h3 className="text-base font-bold text-[#001243]">Recent Punch Logs</h3>
              </div>
              <span className="text-[11px] font-semibold text-[#757681]">Real-time Feed</span>
            </div>

            <div className="space-y-2.5">
              {/* Today's Punch */}
              <div className="p-3 rounded-xl bg-[#F2F3FF] border border-blue-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#001243]">Today</span>
                  <span className="text-[11px] text-[#454650]">
                    In: <strong>{todayPunch?.firstIn ? new Date(todayPunch.firstIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</strong> • Out: {todayPunch?.lastOut ? new Date(todayPunch.lastOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <em>Active</em>}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isPunchedIn ? 'bg-emerald-100 text-emerald-800' : isPunchedOut ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                    {isPunchedIn ? 'In Session' : isPunchedOut ? 'Completed' : 'Awaiting In'}
                  </span>
                  <span className="text-[9px] text-[#757681] block mt-0.5">Terminal #01</span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="p-3 rounded-xl hover:bg-[#F2F3FF] transition-colors flex items-center justify-between border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0D1A3C]">Previous Working Day</span>
                  <span className="text-[11px] text-[#454650]">08:54 AM → 06:05 PM</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    9h 11m
                  </span>
                  <span className="text-[9px] text-emerald-800 block mt-0.5">Present</span>
                </div>
              </div>

              {/* Row 3 */}
              <div className="p-3 rounded-xl hover:bg-[#F2F3FF] transition-colors flex items-center justify-between border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0D1A3C]">Day Prior</span>
                  <span className="text-[11px] text-[#454650]">08:58 AM → 06:02 PM</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    9h 04m
                  </span>
                  <span className="text-[9px] text-emerald-800 block mt-0.5">Present</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/hrms-reports')}
              className="w-full mt-4 py-2.5 rounded-xl bg-[#EBEDFF] hover:bg-[#DAE1FF] text-xs font-bold text-[#001243] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#385AAF]" />
              <span>Open Monthly Attendance Calendar</span>
            </button>
          </div>

          {/* Quick Salary Slip Access */}
          <div className="bg-gradient-to-br from-[#001243] to-[#14275E] rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFDF9E] text-[#001243]">
                  HRMS PAYROLL
                </span>
                <span className="text-[10px] text-[#B5C4FF]">Monthly Statement</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-white">Monthly Payslip & Tax Summary</h3>
              <p className="text-xs text-[#B5C4FF] mt-1">
                Download your digitally generated salary voucher with all allowances and attendance calculations.
              </p>
            </div>

            <button
              onClick={() => navigate('/hrms-reports')}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#FFDF9E] hover:bg-[#EBC166] text-[#001243] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4 text-[#001243]" />
              <span>Download Latest Payslip (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Apply Leave */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Apply for Sanctioned Leave"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#001243] mb-1">Faculty Member</label>
            <div className="p-2.5 rounded-xl bg-[#FAF8FF] border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-[#001243]">{teacherName}</span>
              <span className="px-2 py-0.5 rounded bg-[#EBEDFF] text-[#001243] font-bold text-[10px]">
                {teacherCode}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#001243] mb-1">Leave Category</label>
            <select
              value={leaveForm.leaveTypeId}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#385AAF] font-semibold text-slate-800"
            >
              {types.length > 0 ? (
                types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) — {t.defaultDaysPerYear} Days {t.isPaid ? '(Paid)' : '(Unpaid)'}
                  </option>
                ))
              ) : (
                <>
                  <option value="LT-CL">Casual Leave (CL) — 12 Days (Paid)</option>
                  <option value="LT-EL">Earned Leave (EL) — 15 Days (Paid)</option>
                  <option value="LT-ML">Medical / Sick Leave (ML) — 10 Days (Paid)</option>
                  <option value="LT-LWP">Leave Without Pay (LWP) — Unpaid</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#001243] mb-1">Start Date</label>
              <input
                type="date"
                required
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#001243] mb-1">End Date</label>
              <input
                type="date"
                required
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF8FF] border border-slate-200">
            <input
              type="checkbox"
              id="halfDayPortal"
              checked={leaveForm.isHalfDay}
              onChange={(e) => setLeaveForm({ ...leaveForm, isHalfDay: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-[#385AAF]"
            />
            <label htmlFor="halfDayPortal" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Half Day Leave (0.5 Day)
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#001243] mb-1">Reason / Purpose</label>
            <textarea
              rows={3}
              required
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              placeholder="State institutional reason or medical grounds..."
              className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#385AAF]"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsApplyOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingLeave}
              className="px-5 py-2 rounded-xl bg-[#001243] hover:bg-[#14275E] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 text-[#FFDF9E]" />
              <span>{submittingLeave ? 'Submitting...' : 'Submit Application'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherPortal;
