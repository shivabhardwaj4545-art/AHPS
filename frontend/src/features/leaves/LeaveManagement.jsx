import React, { useState, useEffect } from 'react';
import { leavesApi } from '../../api/endpoints.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import {
  UserCheck,
  Check,
  X,
  Calendar,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const LeaveManagement = () => {
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Decision Modal
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [activeReq, setActiveReq] = useState(null);
  const [actionType, setActionType] = useState('APPROVED');
  const [comments, setComments] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, typesRes] = await Promise.all([
        leavesApi.listRequests({ status: statusFilter || undefined, limit: 100 }),
        leavesApi.getTypes(),
      ]);
      setRequests(reqRes.data || []);
      setTypes(typesRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleOpenDecision = (req, type) => {
    setActiveReq(req);
    setActionType(type);
    setComments(type === 'APPROVED' ? 'Approved by School Administrator.' : 'Insufficient documentation/coverage.');
    setIsDecisionOpen(true);
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!activeReq) return;
    try {
      await leavesApi.review(activeReq.id, {
        action: actionType,
        reviewComments: comments,
      });
      alert(`Leave request has been ${actionType.toLowerCase()}.`);
      setIsDecisionOpen(false);
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Teacher Leave Administration</h2>
          <p className="text-xs text-slate-500 mt-1">
            Review teacher leave applications, deduct balances, and automatically record attendance
          </p>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-lg text-xs font-semibold border-slate-300 bg-slate-50 text-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Leave Types Policy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {types.map((lt) => (
          <div key={lt.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {lt.code}
            </span>
            <h4 className="font-bold text-sm text-slate-800 mt-2">{lt.name}</h4>
            <p className="text-xs text-slate-500 mt-1">
              Annual Quota: <span className="font-semibold text-slate-700">{lt.defaultDaysPerYear} Days</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lt.isPaid ? 'Paid Leave • Balance Tracked' : 'Unpaid (LWP) • Deducted in Payroll'}
            </p>
          </div>
        ))}
      </div>

      {/* Requests Table */}
      {loading ? (
        <LoadingSpinner label="Fetching leave applications..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Teacher</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No leave requests found matching filter.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const empCode =
                      r.employee?.employeeCode ||
                      r.employee?.employeeId ||
                      r.employeeCode ||
                      r.employeeId ||
                      'AHPS-T00';
                    const empName = r.employee?.name || r.employeeName || 'Faculty Member';
                    const typeName =
                      typeof r.leaveType === 'object'
                        ? `${r.leaveType?.name || 'Leave'} (${r.leaveType?.code || 'CL'})`
                        : r.leaveType || 'Casual Leave (CL)';
                    const startDateStr = r.startDate
                      ? String(r.startDate).slice(0, 10)
                      : '';
                    const endDateStr = r.endDate
                      ? String(r.endDate).slice(0, 10)
                      : '';
                    const durationText =
                      r.duration ||
                      (startDateStr && endDateStr
                        ? `${startDateStr} to ${endDateStr}`
                        : startDateStr || '1 Day');
                    const daysVal = r.totalDays ?? r.days ?? 1;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-blue-700 block">{empCode}</span>
                          <span className="font-medium text-slate-800">{empName}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {typeName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {durationText}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{daysVal} {Number(daysVal) === 1 ? 'Day' : 'Days'}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={r.reason}>
                          {r.reason}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {r.status === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => handleOpenDecision(r, 'APPROVED')}
                                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                title="Approve Leave"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDecision(r, 'REJECTED')}
                                className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                                title="Reject Leave"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Resolved</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={isDecisionOpen}
        onClose={() => setIsDecisionOpen(false)}
        title={`${actionType === 'APPROVED' ? 'Approve' : 'Reject'} Leave for ${activeReq?.employee?.name || activeReq?.employeeName || 'Faculty Member'}`}
      >
        <form onSubmit={handleSubmitDecision} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Admin Review Comments</label>
            <textarea
              required
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full p-2 border rounded-lg border-slate-300"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={() => setIsDecisionOpen(false)} className="px-4 py-2 border rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white font-semibold rounded-lg ${
                actionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Confirm {actionType}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

