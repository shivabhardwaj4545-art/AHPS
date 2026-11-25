import React, { useState, useEffect } from 'react';
import { attendanceApi, employeesApi } from '../../api/endpoints.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  CalendarDays,
  Lock,
  Unlock,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';

export const MonthlyAttendanceGrid = () => {
  const [month, setMonth] = useState('2026-11');
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [locking, setLocking] = useState(false);

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const fetchGridData = async () => {
    try {
      setLoading(true);
      const [empRes, attRes] = await Promise.all([
        employeesApi.list({ limit: 100 }),
        attendanceApi.getMonthly({ month }),
      ]);
      setTeachers(empRes.data || []);
      setAttendance(attRes.data || []);

      const sampleRecord = attRes.data?.[0];
      setIsLocked(sampleRecord?.lockedPeriod?.isLocked || false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGridData();
  }, [month]);

  const handleLockPeriod = async () => {
    if (!confirm(`Are you sure you want to close and LOCK attendance for ${month}? No further biometric edits or regularizations will be permitted.`)) return;
    try {
      setLocking(true);
      await attendanceApi.lockPeriod(month, { notes: 'Month closing approved by School Admin.' });
      alert(`Attendance period for ${month} is now LOCKED.`);
      setIsLocked(true);
      fetchGridData();
    } catch (err) {
      alert('Lock error: ' + (err?.message || 'Check open requests'));
    } finally {
      setLocking(false);
    }
  };

  const getDayStatus = (empId, day) => {
    const dayDateStr = `${month}-${String(day).padStart(2, '0')}`;
    const record = attendance.find(
      (a) => a.employeeId === empId && a.date.startsWith(dayDateStr)
    );
    if (!record) return null;
    return record.status;
  };

  const renderBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return <span className="bg-emerald-500 text-white px-1 py-0.5 rounded text-[9px] font-bold">P</span>;
      case 'LATE':
        return <span className="bg-amber-500 text-white px-1 py-0.5 rounded text-[9px] font-bold">L</span>;
      case 'HALF_DAY':
        return <span className="bg-purple-500 text-white px-1 py-0.5 rounded text-[9px] font-bold">H</span>;
      case 'ABSENT':
        return <span className="bg-rose-500 text-white px-1 py-0.5 rounded text-[9px] font-bold">A</span>;
      case 'ON_LEAVE':
        return <span className="bg-blue-500 text-white px-1 py-0.5 rounded text-[9px] font-bold">LV</span>;
      case 'WEEKLY_OFF':
        return <span className="bg-slate-300 text-slate-700 px-1 py-0.5 rounded text-[9px] font-bold">WO</span>;
      case 'HOLIDAY':
        return <span className="bg-teal-500 text-white px-1 py-0.5 rounded text-[9px] font-bold">HD</span>;
      case 'MISSING_PUNCH':
        return <span className="bg-orange-600 text-white px-1 py-0.5 rounded text-[9px] font-bold animate-pulse">MP</span>;
      default:
        return <span className="text-slate-300 text-[10px]">—</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-800">Monthly Attendance Grid</h2>
            {isLocked ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                <Lock className="h-3 w-3" />
                <span>LOCKED</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                <Unlock className="h-3 w-3" />
                <span>OPEN</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Institutional monthly calendar view for payroll reconciliation and month closing
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="p-2 border rounded-lg text-xs font-semibold border-slate-300 bg-slate-50 text-slate-800"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 text-xs font-medium text-slate-600">
        <div className="flex items-center space-x-1.5">
          <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">P</span>
          <span>Present</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">L</span>
          <span>Late</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="bg-purple-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">H</span>
          <span>Half Day</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">A</span>
          <span>Absent</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">LV</span>
          <span>Leave</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="bg-slate-300 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">WO</span>
          <span>Weekly Off</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="bg-orange-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">MP</span>
          <span>Missing Punch</span>
        </div>
      </div>

      {/* Grid Table */}
      {loading ? (
        <LoadingSpinner label="Constructing Attendance Matrix..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-center text-[11px] border-collapse">
              <thead className="bg-slate-800 text-white font-semibold sticky top-0 z-20">
                <tr>
                  <th className="py-2.5 px-3 text-left sticky left-0 z-30 bg-slate-900 min-w-[160px]">
                    Teacher Name
                  </th>
                  {dayNumbers.map((d) => (
                    <th key={d} className="py-2.5 px-1 min-w-[28px]">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-left font-medium sticky left-0 z-10 bg-white border-r border-slate-200 truncate max-w-[160px]">
                      <span className="font-mono font-bold text-blue-700 mr-1">{t.employeeId}</span>
                      <span className="text-slate-800">{t.name}</span>
                    </td>
                    {dayNumbers.map((d) => {
                      const status = getDayStatus(t.id, d);
                      return (
                        <td key={d} className="py-1.5 px-0.5 border-r border-slate-100">
                          {renderBadge(status)}
                        </td>
                      );
                    })}
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

