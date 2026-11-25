import React, { useState, useEffect } from 'react';
import { payrollApi, reportsApi, payslipsApi } from '../../api/endpoints.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import {
  Banknote,
  FileSpreadsheet,
  Download,
  CheckCircle,
  Lock,
  PauseCircle,
  PlayCircle,
  FileText,
  DollarSign,
  AlertCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const PayrollManagement = () => {
  const [month, setMonth] = useState('2026-11');
  const [payrollRun, setPayrollRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await payrollApi.getRun(month);
      setPayrollRun(res.data || null);
    } catch (e) {
      console.error(e);
      setPayrollRun(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month]);

  const handleGenerate = async () => {
    try {
      setCalculating(true);
      await payrollApi.generateDraft({ month });
      alert(`Payroll generated successfully for ${month}!`);
      await fetchPayroll();
    } catch (err) {
      alert('Error generating payroll: ' + (err?.message || 'Check attendance'));
    } finally {
      setCalculating(false);
    }
  };

  const handleReview = async () => {
    if (!payrollRun) return;
    try {
      await payrollApi.review(payrollRun.id);
      alert('Payroll marked as REVIEWED.');
      fetchPayroll();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleApprove = async () => {
    if (!payrollRun) return;
    if (
      !confirm('Approve and lock payroll for this month? Payslips will be generated.')
    )
      return;
    try {
      await payrollApi.approve(payrollRun.id);
      alert('Payroll approved and locked!');
      fetchPayroll();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleMarkPaid = async () => {
    if (!payrollRun) return;
    if (
      !confirm('Mark payroll as PAID and publish all payslips to teachers?')
    )
      return;
    try {
      await payrollApi.markPaid(payrollRun.id);
      alert('Payroll marked as PAID and payslips published to teachers!');
      fetchPayroll();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleToggleHold = async (itemId, currentHold) => {
    const reason = !currentHold
      ? prompt('Enter reason for holding salary (e.g., Pending clearance):')
      : '';
    if (!currentHold && !reason) return;
    try {
      await payrollApi.toggleHold(itemId, { isHeld: !currentHold, reason });
      fetchPayroll();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await reportsApi.downloadPayrollExcel(month);
      const blob = new Blob([response], {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Salary-Register-${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Error downloading Excel: ' + e.message);
    }
  };

  const handleDownloadBankCsv = async () => {
    try {
      const response = await reportsApi.downloadBankCsv(month);
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bank-Transfer-${month}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Error downloading CSV: ' + e.message);
    }
  };

  const handleDownloadPayslip = async (payslipId) => {
    try {
      const response = await payslipsApi.downloadPdf(payslipId);
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${payslipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Error downloading PDF payslip: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Finance & Compensation</span>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-600">Payroll Engine</span>
          </div>

          <div className="flex items-center space-x-3 mt-1">
            <h2 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
              Faculty Salary & Payroll Ledger
            </h2>
            {payrollRun && <StatusBadge status={payrollRun.status} />}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluates gross salary, attendance proration, unexcused deductions, and net payable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {(!payrollRun || payrollRun.status === 'DRAFT') && (
            <button
              onClick={handleGenerate}
              disabled={calculating}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Banknote className="h-4 w-4" />
              <span>{calculating ? 'Computing...' : 'Calculate Payroll'}</span>
            </button>
          )}

          {payrollRun?.status === 'DRAFT' && (
            <button
              onClick={handleReview}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              Mark Reviewed
            </button>
          )}

          {payrollRun?.status === 'REVIEWED' && (
            <button
              onClick={handleApprove}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Approve & Lock</span>
            </button>
          )}

          {payrollRun?.status === 'APPROVED' && (
            <button
              onClick={handleMarkPaid}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Mark Paid & Publish</span>
            </button>
          )}

          {payrollRun && (
            <div className="flex items-center space-x-1.5 pl-1">
              <button
                onClick={handleDownloadExcel}
                title="Download Excel Salary Register"
                className="p-2 bg-slate-50 hover:bg-slate-100 text-emerald-700 rounded-xl border border-slate-200 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
              </button>
              <button
                onClick={handleDownloadBankCsv}
                title="Download Bank Transfer CSV"
                className="p-2 bg-slate-50 hover:bg-slate-100 text-indigo-700 rounded-xl border border-slate-200 transition-colors"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Summary Cards */}
      {payrollRun && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-card">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Faculty
            </span>
            <h4 className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {payrollRun.totalEmployees}
            </h4>
            <span className="text-xs text-slate-400 mt-0.5 block">Active Roster</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-card">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Gross Obligation
            </span>
            <h4 className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ₹ {payrollRun.totalGross.toLocaleString('en-IN')}
            </h4>
            <span className="text-xs text-slate-400 mt-0.5 block">Pre-deduction Base</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-card">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              Biometric Deductions
            </span>
            <h4 className="text-2xl font-bold font-mono text-rose-700 mt-1">
              − ₹ {payrollRun.totalDeductions.toLocaleString('en-IN')}
            </h4>
            <span className="text-xs text-rose-600 mt-0.5 block">Late & Unpaid Absences</span>
          </div>

          <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-200/80 shadow-card">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Net Disbursable
            </span>
            <h4 className="text-2xl font-bold font-mono text-emerald-800 mt-1">
              ₹ {payrollRun.totalNet.toLocaleString('en-IN')}
            </h4>
            <span className="text-xs text-emerald-700 mt-0.5 block">Bank Transfer Ready</span>
          </div>
        </div>
      )}

      {/* Payroll Items Table */}
      {loading ? (
        <LoadingSpinner label="Loading Salary Register..." />
      ) : !payrollRun ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-card">
          <Banknote className="h-12 w-12 text-indigo-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">
            No Payroll Run Generated for {month}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "Calculate Payroll" to evaluate active teachers, attendance records, late penalty deductions, and net pay.
          </p>
          <button
            onClick={handleGenerate}
            disabled={calculating}
            className="mt-5 px-5 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Calculate Payroll Now
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Payable Days</th>
                  <th className="py-3 px-4">Gross Pay</th>
                  <th className="py-3 px-4">Unpaid Deductions</th>
                  <th className="py-3 px-4">Additions/Bonus</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4">Status / Hold</th>
                  <th className="py-3 px-4 text-right">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollRun.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase shrink-0 text-[11px]">
                          {item.employee?.name?.[0] || 'T'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block truncate">
                            {item.employee?.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 block truncate">
                            {item.employee?.employeeId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-slate-800">
                        {item.payableDays}
                      </span>
                      <span className="text-slate-400">
                        {' '}
                        / {item.totalDaysInMonth}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      ₹ {item.grossSalary.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-rose-600">
                      {item.unpaidLeaveDeductions > 0
                        ? `− ₹ ${item.unpaidLeaveDeductions.toLocaleString('en-IN')}`
                        : '₹ 0'}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-emerald-600">
                      {item.bonusArrears + item.additions > 0
                        ? `+ ₹ ${(item.bonusArrears + item.additions).toLocaleString('en-IN')}`
                        : '₹ 0'}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                      ₹ {item.netSalary.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      {item.isHeld ? (
                        <button
                          onClick={() => handleToggleHold(item.id, item.isHeld)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 cursor-pointer"
                        >
                          <PauseCircle className="h-3 w-3" />
                          <span>HELD: {item.holdReason}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleHold(item.id, item.isHeld)}
                          className="text-slate-400 hover:text-slate-600 text-[11px] underline cursor-pointer"
                        >
                          Hold Salary
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {item.payslip ? (
                        <button
                          onClick={() => handleDownloadPayslip(item.payslip.id)}
                          title="Download PDF Payslip"
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-indigo-200/60"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>PDF</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">On Approval</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
