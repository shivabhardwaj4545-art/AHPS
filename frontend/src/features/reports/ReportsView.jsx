import React, { useState, useEffect } from 'react';
import { reportsApi, auditLogsApi } from '../../api/endpoints.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  Sparkles,
  Users,
} from 'lucide-react';

export const ReportsView = () => {
  const [month, setMonth] = useState('2024-10');
  const [department, setDepartment] = useState('all');
  const [threshold, setThreshold] = useState('all');
  const [lateRecords, setLateRecords] = useState([]);
  const [absentRecords, setAbsentRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sample report rows matching Stitch Screen 6
  const reportRoster = [
    {
      id: 'AHPS-T014',
      name: 'Rajesh Sharma',
      code: 'AHPS-T014',
      cadre: 'PGT Physics',
      dept: 'Science & Biotech',
      workingDays: 22,
      presentDays: 21,
      lateDays: 1,
      absentDays: 0,
      punctualityRate: '95.4%',
      status: 'Compliant',
      statusClass: 'bg-[#DCFCE7] text-[#16A34A]',
    },
    {
      id: 'AHPS-T029',
      name: 'Ananya Sen',
      code: 'AHPS-T029',
      cadre: 'TGT English',
      dept: 'Languages',
      workingDays: 22,
      presentDays: 22,
      lateDays: 0,
      absentDays: 0,
      punctualityRate: '100%',
      status: 'Perfect (100%)',
      statusClass: 'bg-[#DCFCE7] text-[#16A34A]',
    },
    {
      id: 'AHPS-T008',
      name: 'Harpreet Singh',
      code: 'AHPS-T008',
      cadre: 'Head of Sports',
      dept: 'Physical Ed',
      workingDays: 22,
      presentDays: 20,
      lateDays: 4,
      absentDays: 1,
      punctualityRate: '81.8%',
      status: 'Flagged (Late > 3d)',
      statusClass: 'bg-[#FFDAD6] text-[#93000A]',
    },
    {
      id: 'AHPS-T032',
      name: 'Meenakshi Iyer',
      code: 'AHPS-T032',
      cadre: 'PGT Mathematics',
      dept: 'Mathematics',
      workingDays: 22,
      presentDays: 18,
      lateDays: 0,
      absentDays: 4,
      punctualityRate: '81.8%',
      status: 'Sanctioned Leave',
      statusClass: 'bg-[#DAE1FF] text-[#1A4195]',
    },
    {
      id: 'AHPS-T045',
      name: 'Vikram Rathore',
      code: 'AHPS-T045',
      cadre: 'TGT Chemistry',
      dept: 'Science & Biotech',
      workingDays: 22,
      presentDays: 21,
      lateDays: 2,
      absentDays: 0,
      punctualityRate: '90.9%',
      status: 'Compliant',
      statusClass: 'bg-[#DCFCE7] text-[#16A34A]',
    },
    {
      id: 'AHPS-T061',
      name: 'Sunita Verma',
      code: 'AHPS-T061',
      cadre: 'PRT Primary',
      dept: 'Primary Wing',
      workingDays: 22,
      presentDays: 22,
      lateDays: 0,
      absentDays: 0,
      punctualityRate: '100%',
      status: 'Perfect (100%)',
      statusClass: 'bg-[#DCFCE7] text-[#16A34A]',
    },
  ];

  const handleDownloadExcel = async () => {
    try {
      const response = await reportsApi.downloadPayrollExcel(month);
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AHPS-Attendance-Register-${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Downloading institutional report for ' + month);
    }
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Academic Context Ribbon & Breadcrumbs (Screen 6) */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-1">
        <div className="flex items-center gap-2 text-xs text-[#757681]">
          <span className="flex items-center gap-1 hover:text-[#001243] cursor-pointer transition-colors">
            <Users className="h-4 w-4 text-[#385AAF]" /> Institutional ERP
          </span>
          <ChevronRight className="h-3 w-3" />
          <span>Faculty Administration</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#001243] font-bold">Teacher Attendance Reports & Analytics</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#EBEDFF] text-[#001243] text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#385AAF]"></span>
            Term 1 Summary: 84 Certified Educators
          </span>
          <span className="px-3 py-1 rounded-full bg-[#FFDF9E] text-[#001243] text-xs font-bold shadow-sm">
            CBSE Affiliation #2130842
          </span>
        </div>
      </div>

      {/* 2. Primary Section Header Card */}
      <div className="relative bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-[#C5C6D1]/20 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#001243] via-[#EBC166] to-[#001243]"></div>
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#DCE1FF]/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EBEDFF] text-[11px] uppercase tracking-wider text-[#001243] font-bold">
              <Sparkles className="h-3.5 w-3.5 text-[#392800]" />
              Monthly Staff Register Audit
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#001243] tracking-tight">
              Faculty Attendance & Punctuality Register
            </h2>
            <p className="text-xs md:text-sm text-[#454650]">
              Comprehensive biometric reconciliation, punctuality index, and compliance analysis across PGT, TGT, PRT, and Vocational departments for Academic Session 2024–25.
            </p>
          </div>

          {/* Quick Export Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#EBEDFF] text-[#001243] hover:bg-[#DAE1FF] text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <FileText className="h-4 w-4 text-[#BA1A1A]" />
              <span>Export AHPS Letterhead</span>
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#001243] text-white hover:bg-[#14275E] text-xs font-bold shadow-md transition-all cursor-pointer ring-1 ring-[#FFDF9E]"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#FFDF9E]" />
              <span>Export to Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-6 pt-4 bg-[#F2F3FF] rounded-xl p-4 border border-[#C5C6D1]/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[10px] uppercase font-bold text-[#454650] block mb-1">
                Month & Billing Cycle
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white text-xs font-bold text-[#001243] border border-[#C5C6D1]/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#454650] block mb-1">
                Academic Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white text-xs font-semibold text-[#001243] border border-[#C5C6D1]/40 focus:outline-none"
              >
                <option value="all">All Departments (12)</option>
                <option value="science">Sciences & Mathematics</option>
                <option value="languages">Languages & Literature</option>
                <option value="social">Social Sciences & Humanities</option>
                <option value="primary">Primary & Junior Wing</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#454650] block mb-1">
                Compliance Threshold
              </label>
              <select
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white text-xs font-semibold text-[#BA1A1A] border border-[#C5C6D1]/40 focus:outline-none"
              >
                <option value="all">All Staff Records</option>
                <option value="flagged">Attendance &lt; 85% (Flagged)</option>
                <option value="late">Late Arrivals &gt; 3 Days</option>
                <option value="perfect">Perfect Attendance (100%)</option>
              </select>
            </div>

            <div>
              <button
                onClick={() => alert('Filters applied to register')}
                className="w-full py-2.5 px-4 rounded-lg bg-[#385AAF] hover:bg-[#2B4FA3] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 4 Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#C5C6D1]/20 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-[#757681]">Staff Attendance Index</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-3xl font-extrabold text-[#001243]">93.4%</span>
                <span className="text-xs font-bold text-[#385AAF] flex items-center">
                  <TrendingUp className="h-3 w-3" /> +1.8%
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#DAE1FF] flex items-center justify-center text-[#1A4195]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-end gap-1.5 h-6">
            <div className="w-full bg-[#DAE1FF] rounded-t h-[75%]"></div>
            <div className="w-full bg-[#DAE1FF] rounded-t h-[85%]"></div>
            <div className="w-full bg-[#DAE1FF] rounded-t h-[92%]"></div>
            <div className="w-full bg-[#385AAF] rounded-t h-[94%]"></div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#C5C6D1]/20 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-[#757681]">Late Arrivals (Oct)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-3xl font-extrabold text-[#261A00]">14</span>
                <span className="text-xs text-[#757681]">Instances</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#FFDF9E] flex items-center justify-center text-[#261A00]">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-[#757681] mt-2">Avg delay: +12m post 09:15 cutoff</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#C5C6D1]/20 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-[#757681]">Critical Absentees</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-3xl font-extrabold text-[#BA1A1A]">03</span>
                <span className="text-xs font-bold text-[#BA1A1A]">&lt; 85% Rate</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#FFDAD6] flex items-center justify-center text-[#BA1A1A]">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-[#BA1A1A] mt-2">Notice slips generated for review</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#C5C6D1]/20 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-[#757681]">Avg In-Time</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-3xl font-extrabold text-[#001243]">08:58 AM</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#EBEDFF] flex items-center justify-center text-[#001243]">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-[#385AAF] font-medium mt-2">17 mins prior to gate closure</p>
        </div>
      </div>

      {/* 4. Detailed Tabular Staff Attendance Register */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#C5C6D1]/20 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2F3FF]">
          <div>
            <h3 className="text-base font-bold text-[#001243]">Faculty Attendance Breakdown</h3>
            <p className="text-xs text-[#757681]">Detailed roll register with punctuality compliance rating</p>
          </div>
          <span className="text-xs font-bold text-[#001243]">October 2024 Cycle</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F2F3FF] text-[#454650] uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-4">Cadre & Dept</th>
                <th className="py-3 px-4">Working Days</th>
                <th className="py-3 px-4">Present / Late / Absent</th>
                <th className="py-3 px-4">Punctuality %</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F3FF]">
              {reportRoster.map((row) => (
                <tr key={row.id} className="hover:bg-[#F2F3FF]/50 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#14275E] text-[#FFDF9E] font-bold flex items-center justify-center text-xs">
                        {row.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#001243]">{row.name}</span>
                        <span className="text-[10px] text-[#757681] font-mono">{row.code}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>{row.cadre}</div>
                    <div className="text-[10px] text-[#757681]">{row.dept}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#001243]">{row.workingDays} Days</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-emerald-700 font-bold">{row.presentDays}P</span>
                      <span>•</span>
                      <span className="text-amber-700 font-bold">{row.lateDays}L</span>
                      <span>•</span>
                      <span className="text-rose-700 font-bold">{row.absentDays}A</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#001243]">{row.punctualityRate}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.statusClass}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => alert('Detailed attendance sheet for ' + row.name)}
                      className="text-[#385AAF] hover:underline font-bold text-xs"
                    >
                      View Sheet →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
