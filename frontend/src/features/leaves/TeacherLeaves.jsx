import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/authContext.jsx';
import { leavesApi } from '../../api/endpoints.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import { Modal } from '../../components/Modal.jsx';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Send,
  FileText,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const TeacherLeaves = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const employeeId = user?.employee?.id || user?.employeeId || 'AHPS-T014';
  const teacherName = user?.name || 'Dr. Rajesh Sharma';
  const teacherCode = user?.employeeCode || user?.employee?.employeeCode || 'AHPS-T014';

  const [form, setForm] = useState({
    leaveTypeId: 'LT-CL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isHalfDay: false,
    reason: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balRes, reqRes, typRes] = await Promise.all([
        leavesApi.getBalances(employeeId),
        leavesApi.listRequests({ limit: 100 }),
        leavesApi.getTypes(),
      ]);

      const balList = Array.isArray(balRes.data) ? balRes.data : balRes.data?.balances || [];
      const reqList = Array.isArray(reqRes.data) ? reqRes.data : reqRes.data?.requests || [];
      const typeList = Array.isArray(typRes.data) ? typRes.data : typRes.data?.types || [];

      setBalances(balList);
      // Filter requests belonging to this teacher
      const myReqs = reqList.filter(
        (r) =>
          !r.employeeId ||
          r.employeeId === employeeId ||
          r.employeeCode === teacherCode ||
          r.employeeName === teacherName ||
          user?.role === 'PRINCIPAL' ||
          user?.role === 'ADMIN'
      );
      setRequests(myReqs);
      setTypes(typeList);

      if (typeList[0]?.id) {
        setForm((prev) => ({ ...prev, leaveTypeId: typeList[0].id }));
      }
    } catch (e) {
      console.error('Error fetching teacher leaves:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      alert('Please state a valid reason for your leave application.');
      return;
    }
    try {
      setSubmitting(true);
      await leavesApi.apply({
        ...form,
        employeeId,
        employeeCode: teacherCode,
        employeeName: teacherName,
      });
      alert('Leave application submitted successfully for Administrative review.');
      setIsApplyOpen(false);
      setForm({
        leaveTypeId: types[0]?.id || 'LT-CL',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        isHalfDay: false,
        reason: '',
      });
      await fetchData();
    } catch (err) {
      alert('Error submitting application: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDays = () => {
    if (form.isHalfDay) return '0.5 Day (Half Day)';
    if (!form.startDate || !form.endDate) return '1 Day';
    const s = new Date(form.startDate);
    const e = new Date(form.endDate);
    if (e < s) return 'Invalid Range';
    const diff = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
    return `${diff} Day${diff > 1 ? 's' : ''}`;
  };

  const filteredRequests = statusFilter
    ? requests.filter((r) => r.status === statusFilter)
    : requests;

  if (loading) return <LoadingSpinner label="Loading Faculty Leave Ledger & Balances..." />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#001243] via-[#14275E] to-[#385AAF] rounded-2xl p-6 text-white shadow-lg border border-[#FFDF9E]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] bg-[#FFDF9E] text-[#001243] font-bold tracking-wider uppercase">
              {teacherCode}
            </span>
            <span className="text-xs text-[#B5C4FF] font-medium">Faculty Leave Management Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
            Leave Ledger & Credit Entitlements
          </h1>
          <p className="text-xs text-[#B5C4FF] mt-1 max-w-xl">
            View real-time leave quotas, submitted absence applications, approval statuses, and official institutional leaves ledger.
          </p>
        </div>

        <button
          onClick={() => setIsApplyOpen(true)}
          className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-[#FFDF9E] hover:bg-[#EBC166] text-[#001243] font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 text-[#392800]" />
          <span>Apply For Leave</span>
        </button>
      </div>

      {/* 2. Leave Quota & Balance Cards (Updated in real-time) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => {
          const type = b.leaveType || {};
          const code = typeof type === 'object' ? (type.code || 'LEAVE') : String(type);
          const isPaid = type.isPaid !== false;
          const totalAllowance = Number(b.totalAllowance ?? b.allocatedDays ?? 12) || 0;
          const usedDays = Number(b.usedDays || 0);
          const pendingDays = Number(b.pendingDays || 0);
          const available = Number(
            b.availableDays !== undefined ? b.availableDays : Math.max(0, totalAllowance - usedDays)
          );

          let colorStyles = {
            border: 'border-[#385AAF]/30',
            bg: 'bg-blue-50/50',
            bar: 'bg-[#385AAF]',
            text: 'text-[#001243]',
            badge: 'bg-[#EBEDFF] text-[#001243]',
          };
          if (code === 'CL') {
            colorStyles = {
              border: 'border-emerald-200',
              bg: 'bg-emerald-50/40',
              bar: 'bg-emerald-600',
              text: 'text-emerald-950',
              badge: 'bg-emerald-100 text-emerald-800',
            };
          } else if (code === 'ML') {
            colorStyles = {
              border: 'border-blue-200',
              bg: 'bg-blue-50/40',
              bar: 'bg-blue-600',
              text: 'text-blue-950',
              badge: 'bg-blue-100 text-blue-800',
            };
          } else if (code === 'EL') {
            colorStyles = {
              border: 'border-amber-200',
              bg: 'bg-amber-50/40',
              bar: 'bg-[#C9A24B]',
              text: 'text-[#261A00]',
              badge: 'bg-[#FFDF9E] text-[#001243]',
            };
          } else if (code === 'LWP') {
            colorStyles = {
              border: 'border-slate-200',
              bg: 'bg-slate-50/50',
              bar: 'bg-slate-500',
              text: 'text-slate-800',
              badge: 'bg-slate-200 text-slate-700',
            };
          }

          const percentUsed =
            totalAllowance > 0 ? Math.min(100, Math.round((usedDays / totalAllowance) * 100)) : 0;

          return (
            <div
              key={b.id || code}
              className={`bg-white rounded-2xl border ${colorStyles.border} p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${colorStyles.badge}`}>
                    {code}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {isPaid ? 'Paid Leave' : 'Unpaid'}
                  </span>
                </div>

                <h3 className={`font-serif text-lg font-bold ${colorStyles.text}`}>
                  {typeof type === 'object' ? (type.name || code) : String(type)}
                </h3>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold font-serif text-[#001243]">
                    {isNaN(available) ? 0 : available}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    of {totalAllowance} days available
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className={`${colorStyles.bar} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${percentUsed}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Used: <strong className="text-slate-700">{usedDays}d</strong></span>
                  {pendingDays > 0 ? (
                    <span className="text-amber-600 font-bold">
                      {pendingDays}d Pending
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">In Good Standing</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Leave Applications History & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-[#001243]">My Leave Applications History</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review all submitted leave requests, admin decision remarks, and active approvals
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded-lg text-xs font-semibold border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#385AAF]"
            >
              <option value="">All Applications ({requests.length})</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No leave applications found</p>
            <p className="text-xs text-slate-400 mt-1">
              You haven't submitted any leave requests matching the selected filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8FF] text-[#001243] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Duration & Dates</th>
                  <th className="py-3 px-4 text-center">Days</th>
                  <th className="py-3 px-4">Reason / Purpose</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Administrative Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  let statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center justify-center gap-1 w-24 mx-auto">
                      <Clock className="h-3 w-3" /> PENDING
                    </span>
                  );
                  if (req.status === 'APPROVED') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1 w-24 mx-auto">
                        <CheckCircle2 className="h-3 w-3" /> APPROVED
                      </span>
                    );
                  } else if (req.status === 'REJECTED') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center justify-center gap-1 w-24 mx-auto">
                        <XCircle className="h-3 w-3" /> REJECTED
                      </span>
                    );
                  }

                  const typeName =
                    typeof req.leaveType === 'object' && req.leaveType !== null
                      ? `${req.leaveType?.name || 'Leave'} (${req.leaveType?.code || 'CL'})`
                      : String(req.leaveType || req.leaveTypeName || 'Leave');

                  const startDateStr = req.startDate ? String(req.startDate).slice(0, 10) : '';
                  const endDateStr = req.endDate ? String(req.endDate).slice(0, 10) : '';
                  const durationText =
                    req.duration ||
                    (startDateStr && endDateStr ? `${startDateStr} to ${endDateStr}` : startDateStr || '1 Day');

                  const daysCount = Number(req.totalDays ?? req.days ?? 1);

                  return (
                    <tr key={req.id} className="hover:bg-[#FAF8FF]/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#385AAF]">
                        {String(req.id)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#001243]">
                        {typeName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {durationText}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {daysCount} {daysCount === 1 ? 'Day' : 'Days'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="py-3.5 px-4 text-center">{statusBadge}</td>
                      <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">
                        {typeof req.reviewComments === 'object' && req.reviewComments !== null
                          ? JSON.stringify(req.reviewComments)
                          : String(req.reviewComments || (req.status === 'PENDING' ? 'Under Principal review' : 'Resolved'))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Apply For Leave */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Apply for Sanctioned Leave"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#001243] mb-1">
              Faculty Member
            </label>
            <div className="p-2.5 rounded-xl bg-[#FAF8FF] border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-[#001243]">{teacherName}</span>
              <span className="px-2 py-0.5 rounded bg-[#EBEDFF] text-[#001243] font-bold text-[10px]">
                {teacherCode}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#001243] mb-1">
              Select Leave Category
            </label>
            <select
              value={form.leaveTypeId}
              onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#385AAF] font-semibold text-slate-800"
            >
              {types.length > 0 ? (
                types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) — Quota: {t.defaultDaysPerYear} Days {t.isPaid ? '(Paid)' : '(Unpaid)'}
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
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#001243] mb-1">End Date</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8FF] border border-slate-200">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHalfDay"
                checked={form.isHalfDay}
                onChange={(e) => setForm({ ...form, isHalfDay: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-[#385AAF]"
              />
              <label htmlFor="isHalfDay" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Half Day Application (0.5 Day)
              </label>
            </div>
            <span className="text-xs font-bold text-[#385AAF]">
              Total Duration: {calculateDays()}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#001243] mb-1">
              Reason / Duty Arrangements
            </label>
            <textarea
              rows={3}
              required
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="State institutional reason, medical grounds, or class substitution arrangements..."
              className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#385AAF]"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsApplyOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#001243] hover:bg-[#14275E] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 text-[#FFDF9E]" />
              <span>{submitting ? 'Submitting Application...' : 'Submit Application'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherLeaves;
