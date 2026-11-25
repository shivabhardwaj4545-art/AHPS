import React, { useState, useEffect } from 'react';
import {
  settingsApi,
  devicesApi,
  punchesApi,
  employeesApi,
  getSyncedDevices,
  saveSyncedDevices,
  getSyncedPunches,
  saveSyncedPunch,
} from '../../api/endpoints.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import { Modal } from '../../components/Modal.jsx';
import {
  Settings,
  Save,
  Clock,
  Building,
  Fingerprint,
  Wifi,
  Server,
  Key,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Play,
  RotateCcw,
  Radio,
  Cpu,
  Laptop,
  Check,
  Copy,
  Trash2,
} from 'lucide-react';

export const SettingsView = () => {
  const [activeTab, setActiveTab] = useState('biometric');
  const [settings, setSettings] = useState({});
  const [devices, setDevices] = useState([]);
  const [punches, setPunches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // New Device Modal
  const [isNewDeviceOpen, setIsNewDeviceOpen] = useState(false);
  const [newDeviceForm, setNewDeviceForm] = useState({
    deviceCode: 'BIO-GATE-03',
    name: 'Primary Wing Gate Terminal #03',
    brand: 'ZKTeco ProCapture-X Cloud',
    serialNumber: 'ZK-7729110482',
    location: 'Primary Building Ground Floor',
    commType: 'ADMS_CLOUD_PUSH',
    ipAddress: '192.168.1.103',
    port: 80,
  });

  // Simulator Form
  const [simEmployeeId, setSimEmployeeId] = useState('');
  const [simPunchType, setSimPunchType] = useState('CHECK_IN');
  const [simVerifyMode, setSimVerifyMode] = useState('FINGERPRINT');
  const [simTerminal, setSimTerminal] = useState('BIO-GATE-01');
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [setRes, devRes, punchRes, empRes] = await Promise.all([
        settingsApi.list().catch(() => ({ data: [] })),
        devicesApi.list().catch(() => ({ data: [] })),
        punchesApi.getEvents().catch(() => ({ data: [] })),
        employeesApi.list().catch(() => ({ data: [] })),
      ]);

      const map = {};
      (setRes.data || []).forEach((s) => {
        map[s.key] = s.value;
      });
      setSettings(map);
      setDevices(devRes.data || getSyncedDevices());
      setPunches(punchRes.data || getSyncedPunches());

      const emps = empRes.data || [];
      setEmployees(emps);
      if (emps.length > 0 && !simEmployeeId) {
        setSimEmployeeId(emps[0].id || emps[0].employeeCode || 'AHPS-T014');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSetting = async (key, value) => {
    try {
      setSaving(true);
      await settingsApi.update({ key, value });
      setSettings((prev) => ({ ...prev, [key]: value }));
      alert(`Setting '${key}' updated successfully.`);
    } catch (e) {
      alert('Error updating setting: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    try {
      const res = await devicesApi.create(newDeviceForm);
      alert('Biometric Terminal registered successfully!');
      setIsNewDeviceOpen(false);
      await fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteDevice = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete biometric machine "${name || id}"?`)) {
      return;
    }
    try {
      await devicesApi.delete(id);
      alert(`Biometric machine "${name || id}" removed successfully.`);
      await fetchData();
    } catch (err) {
      alert('Error deleting machine: ' + err.message);
    }
  };

  const handleSimulatePunch = async () => {
    try {
      setSimulating(true);
      const selectedEmp = employees.find(
        (e) => e.id === simEmployeeId || e.employeeCode === simEmployeeId
      );
      const nowIso = new Date().toISOString();
      const terminalObj = devices.find((d) => d.deviceCode === simTerminal) || devices[0];

      const punchData = {
        employeeId: selectedEmp?.id || simEmployeeId,
        employeeCode: selectedEmp?.employeeCode || simEmployeeId,
        employeeName: selectedEmp?.name || 'Faculty Member',
        punchType: simPunchType,
        verifyType: simVerifyMode,
        timestamp: nowIso,
        punchTime: nowIso,
        deviceName: terminalObj?.name || 'Main Campus Gate Terminal #01',
        deviceSerial: terminalObj?.serialNumber || 'ZK-8849201478',
      };

      await punchesApi.pushEvents(punchData);
      setSimMessage(
        `✓ Punch [${simPunchType}] for ${punchData.employeeName} pushed via ${terminalObj?.name || 'Gateway'}`
      );
      await fetchData();
      setTimeout(() => setSimMessage(null), 4000);
    } catch (err) {
      alert('Error pushing simulated punch: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Institutional Configuration & Biometric Gateway..." />;

  const webhookUrl = `${window.location.protocol}//${window.location.host}/api/v1/device-events`;
  const deviceSecret = 'biometric-device-secret-token-2026';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#001243] via-[#14275E] to-[#385AAF] rounded-2xl p-6 text-white shadow-lg border border-[#FFDF9E]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] bg-[#FFDF9E] text-[#001243] font-bold tracking-wider uppercase">
              INSTITUTIONAL SETTINGS
            </span>
            <span className="text-xs text-[#B5C4FF] font-medium">Hardware & Policy Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
            System & Biometric Configuration
          </h1>
          <p className="text-xs text-[#B5C4FF] mt-1 max-w-xl">
            Configure cloud biometric punch machines, server webhook endpoints, payroll calculation policies, and institution branding.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/15 self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('biometric')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'biometric'
                ? 'bg-[#FFDF9E] text-[#001243] shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Fingerprint className="h-4 w-4" />
            <span>Cloud Punch Machines</span>
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'payroll'
                ? 'bg-[#FFDF9E] text-[#001243] shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>Payroll Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('timings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'timings'
                ? 'bg-[#FFDF9E] text-[#001243] shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Shift & Grace Rules</span>
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'branding'
                ? 'bg-[#FFDF9E] text-[#001243] shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>School Branding</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CLOUD BIOMETRIC PUNCH MACHINES */}
      {/* ========================================================================= */}
      {activeTab === 'biometric' && (
        <div className="space-y-6">
          {/* A. Live Cloud Connection Parameters Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#001243]">
                    Cloud Biometric Server Gateway Parameters
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure these parameters into your physical/cloud biometric machines (ZKTeco, eSSL, Realtime, Biomax)
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Gateway Listening (Port 80/443)
              </span>
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Push Server URL */}
              <div className="p-4 rounded-xl bg-[#FAF8FF] border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    1. Cloud Push Server / Webhook URL
                  </span>
                  <button
                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                    className="text-xs font-bold text-[#385AAF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'url' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'url' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-300 font-mono text-xs font-bold text-[#001243] break-all select-all">
                  {webhookUrl}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter this as the ADMS / Cloud Server Address in your machine settings.
                </p>
              </div>

              {/* Secret Auth Token */}
              <div className="p-4 rounded-xl bg-[#FAF8FF] border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    2. Device Webhook Secret Token
                  </span>
                  <button
                    onClick={() => copyToClipboard(deviceSecret, 'token')}
                    className="text-xs font-bold text-[#385AAF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'token' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'token' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-300 font-mono text-xs font-bold text-emerald-800 break-all select-all">
                  {deviceSecret}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pass in <code>X-Device-Secret</code> header or device authorization code.
                </p>
              </div>

              {/* Protocol */}
              <div className="p-4 rounded-xl bg-[#FAF8FF] border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  3. Supported Communication Protocol
                </span>
                <div className="p-2.5 rounded-lg bg-white border border-slate-300 font-semibold text-xs text-slate-800">
                  ADMS Cloud Push (Real-time HTTP / HTTPS JSON POST)
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Instant push on finger scan, facial match, or RFID card swipe.
                </p>
              </div>

              {/* Auto Sync Rules */}
              <div className="p-4 rounded-xl bg-[#FAF8FF] border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  4. Automatic Cross-System Synchronization
                </span>
                <div className="p-2.5 rounded-lg bg-white border border-slate-300 font-semibold text-xs text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Admin Attendance + Teacher Portal + HRMS Reports Synced</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Every device event instantly marks faculty present and starts session timers.
                </p>
              </div>
            </div>
          </div>

          {/* B. Connected Hardware Terminals & Add New Device */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-[#001243]">
                  Connected Biometric Machines & Terminals
                </h3>
                <p className="text-xs text-slate-500">
                  Terminals actively reporting faculty check-ins and check-outs
                </p>
              </div>
              <button
                onClick={() => setIsNewDeviceOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#001243] hover:bg-[#14275E] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#FFDF9E]" />
                <span>Add Machine</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((d) => (
                <div
                  key={d.id || d.deviceCode}
                  className="p-5 rounded-2xl border border-slate-200 bg-[#FAF8FF] flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#001243] text-[#FFDF9E]">
                          {d.deviceCode}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          ONLINE
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#001243] mt-1">{d.name}</h4>
                      <p className="text-xs text-slate-500">{d.location}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteDevice(d.id || d.deviceCode, d.name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 bg-white transition-colors cursor-pointer shadow-sm"
                        title="Delete this Biometric Machine"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                        <Cpu className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Model & Brand</span>
                      <strong className="text-slate-700 truncate block">{d.brand}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Serial Number</span>
                      <code className="text-[#385AAF] font-bold text-[11px]">{d.serialNumber}</code>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">IP & Port</span>
                      <span className="text-slate-600 font-mono text-[11px]">
                        {d.ipAddress}:{d.port || 80}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Heartbeat Status</span>
                      <span className="text-emerald-600 font-semibold">{d.lastPing || 'Active (ADMS)'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* C. Interactive Biometric Simulator & Live Test Console */}
          <div className="bg-gradient-to-br from-[#FAF8FF] to-[#F2F3FF] rounded-2xl border border-blue-200/60 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-blue-100 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#001243] text-[#FFDF9E] flex items-center justify-center shadow-sm">
                  <Play className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#001243]">
                    Live Biometric Punch Simulator & Push Console
                  </h3>
                  <p className="text-xs text-slate-600">
                    Test hardware punch ingestion and verify real-time reflection on Admin & Teacher views
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EBEDFF] text-[#001243]">
                Simulator Sandbox
              </span>
            </div>

            {simMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between animate-fadeIn">
                <span>{simMessage}</span>
                <button onClick={() => setSimMessage(null)} className="text-white hover:text-emerald-200">
                  ✕
                </button>
              </div>
            )}

            {/* Simulator Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#001243] mb-1">
                  1. Select Faculty Member
                </label>
                <select
                  value={simEmployeeId}
                  onChange={(e) => setSimEmployeeId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#385AAF]"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id || emp.employeeCode}>
                      {emp.name} ({emp.employeeCode || emp.employeeId}) — {emp.subject || emp.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001243] mb-1">
                  2. Select Biometric Terminal
                </label>
                <select
                  value={simTerminal}
                  onChange={(e) => setSimTerminal(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#385AAF]"
                >
                  {devices.map((dev) => (
                    <option key={dev.deviceCode} value={dev.deviceCode}>
                      {dev.name} ({dev.deviceCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001243] mb-1">
                  3. Punch Event Type
                </label>
                <select
                  value={simPunchType}
                  onChange={(e) => setSimPunchType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#385AAF]"
                >
                  <option value="CHECK_IN">CHECK_IN (Faculty Arrival)</option>
                  <option value="CHECK_OUT">CHECK_OUT (Faculty Departure)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001243] mb-1">
                  4. Verification Biometric Mode
                </label>
                <select
                  value={simVerifyMode}
                  onChange={(e) => setSimVerifyMode(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#385AAF]"
                >
                  <option value="FINGERPRINT">Fingerprint Scanner (ZK Sensor)</option>
                  <option value="FACE_RECOGNITION">3D Face Recognition</option>
                  <option value="RFID_CARD">RFID Smart Proximity Card</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSimulatePunch}
                disabled={simulating}
                className="px-6 py-2.5 rounded-xl bg-[#001243] hover:bg-[#14275E] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Fingerprint className="h-4 w-4 text-[#FFDF9E]" />
                <span>{simulating ? 'Emitting Hardware Event...' : 'Send Hardware Biometric Punch'}</span>
              </button>
            </div>
          </div>

          {/* D. Live Real-Time Biometric Punch Stream Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#001243]">
                  Live Biometric Punch Stream (ADMS Cloud Feed)
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time punches captured from connected machines and teacher digital terminals
                </p>
              </div>
              <span className="text-xs font-bold text-[#385AAF] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                {punches.length} Total Punches Captured
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8FF] text-[#001243] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Terminal / Machine</th>
                    <th className="py-3 px-4 text-center">Punch Type</th>
                    <th className="py-3 px-4">Verify Mode</th>
                    <th className="py-3 px-4 text-center">Sync Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {punches.slice(0, 10).map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-[#FAF8FF]/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {p.timestamp
                          ? new Date(p.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : 'Just now'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#001243]">
                        {p.employeeName || p.employeeId || 'Faculty Member'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.deviceName || 'Gate Terminal #01'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.punchType === 'CHECK_IN' || p.punchType === 'IN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.punchType || 'CHECK_IN'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 flex items-center gap-1.5 mt-2">
                        <Fingerprint className="h-3.5 w-3.5 text-blue-600" />
                        <span>{p.verifyType || 'FINGERPRINT'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          ✓ Synchronized
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYROLL ENGINE SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'payroll' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-800 border-b pb-3">
            <Building className="h-4 w-4 text-blue-600" />
            <span>Payroll Calculation Engine Settings</span>
          </div>

          <div className="space-y-5 text-xs max-w-xl">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Per-Day Salary Divisor Basis
              </label>
              <select
                value={settings.PAYROLL_CALCULATION_BASIS || 'CALENDAR_DAYS'}
                onChange={(e) => handleSaveSetting('PAYROLL_CALCULATION_BASIS', e.target.value)}
                className="w-full p-2.5 border rounded-xl border-slate-300 font-semibold text-slate-800"
              >
                <option value="CALENDAR_DAYS">Actual Calendar Days (e.g. 30, 31, 28)</option>
                <option value="WORKING_DAYS">Working Days Only (Standard 26 days)</option>
                <option value="FIXED_30">Fixed 30 Days Every Month</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Controls the denominator used to derive daily salary rates: <code>Gross Salary / Divisor</code>
              </p>
            </div>

            <div className="pt-2">
              <label className="font-semibold text-slate-700 block mb-1">
                Statutory Deductions Module (PF, ESI, PT, TDS)
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() =>
                    handleSaveSetting(
                      'STATUTORY_DEDUCTIONS_ENABLED',
                      settings.STATUTORY_DEDUCTIONS_ENABLED === 'true' ? 'false' : 'true'
                    )
                  }
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    settings.STATUTORY_DEDUCTIONS_ENABLED === 'true'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {settings.STATUTORY_DEDUCTIONS_ENABLED === 'true' ? 'ENABLED' : 'DISABLED (Default)'}
                </button>
                <span className="text-[11px] text-slate-500">
                  Per school requirement: Statutory module is optional and disabled by default.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SHIFT & GRACE TIMINGS */}
      {/* ========================================================================= */}
      {activeTab === 'timings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-800 border-b pb-3">
            <Clock className="h-4 w-4 text-amber-600" />
            <span>Attendance & Shift Grace Rules</span>
          </div>

          <div className="space-y-4 text-xs max-w-xl">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Global Grace Period (Minutes after shift start)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={settings.GRACE_PERIOD_MINUTES || 15}
                  onChange={(e) => setSettings({ ...settings, GRACE_PERIOD_MINUTES: e.target.value })}
                  className="w-32 p-2.5 border rounded-xl border-slate-300 font-mono font-bold"
                />
                <button
                  onClick={() => handleSaveSetting('GRACE_PERIOD_MINUTES', String(settings.GRACE_PERIOD_MINUTES))}
                  className="px-4 py-2.5 bg-[#001243] hover:bg-[#14275E] text-white font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Save Grace Minutes
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Punches after (Shift Start + Grace Minutes) are tagged LATE with exact elapsed minutes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8FF] border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">Institutional Shift Schedule</span>
              <p className="text-slate-600 text-[11px]">
                Standard Daily Timing: <strong>09:00 AM to 06:00 PM</strong> (Required Duration: 9h 00m).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SCHOOL BRANDING */}
      {/* ========================================================================= */}
      {activeTab === 'branding' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-800 border-b pb-3">
            <Building className="h-4 w-4 text-slate-700" />
            <span>Institution Branding on Payslips</span>
          </div>

          <div className="space-y-4 text-xs max-w-xl">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Legal Institution Name</label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={settings.INSTITUTION_NAME || 'Achievers Home Public School'}
                  onChange={(e) => setSettings({ ...settings, INSTITUTION_NAME: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-slate-300 font-semibold"
                />
                <button
                  onClick={() => handleSaveSetting('INSTITUTION_NAME', settings.INSTITUTION_NAME)}
                  className="px-4 py-2.5 bg-[#001243] text-white font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">CBSE Affiliation Code</label>
              <input
                type="text"
                readOnly
                value="CBSE / AFF / 2130849"
                className="w-full p-2.5 border rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal for Registering New Hardware Device */}
      <Modal
        isOpen={isNewDeviceOpen}
        onClose={() => setIsNewDeviceOpen(false)}
        title="Register Cloud Biometric Machine"
      >
        <form onSubmit={handleRegisterDevice} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#001243] mb-1">Device Code / Terminal ID</label>
            <input
              type="text"
              required
              value={newDeviceForm.deviceCode}
              onChange={(e) => setNewDeviceForm({ ...newDeviceForm, deviceCode: e.target.value })}
              className="w-full p-2.5 border rounded-xl border-slate-300 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-[#001243] mb-1">Terminal Descriptive Name</label>
            <input
              type="text"
              required
              value={newDeviceForm.name}
              onChange={(e) => setNewDeviceForm({ ...newDeviceForm, name: e.target.value })}
              className="w-full p-2.5 border rounded-xl border-slate-300 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#001243] mb-1">Brand & Model</label>
              <input
                type="text"
                required
                value={newDeviceForm.brand}
                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, brand: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-[#001243] mb-1">Serial Number (SN)</label>
              <input
                type="text"
                required
                value={newDeviceForm.serialNumber}
                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, serialNumber: e.target.value })}
                className="w-full p-2.5 border rounded-xl border-slate-300 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#001243] mb-1">Campus Physical Location</label>
            <input
              type="text"
              required
              value={newDeviceForm.location}
              onChange={(e) => setNewDeviceForm({ ...newDeviceForm, location: e.target.value })}
              className="w-full p-2.5 border rounded-xl border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewDeviceOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#001243] hover:bg-[#14275E] text-white font-bold shadow-md"
            >
              Register Machine
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsView;
