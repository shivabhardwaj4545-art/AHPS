import React, { useState, useEffect } from 'react';
import { devicesApi } from '../../api/endpoints.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import {
  Fingerprint,
  RefreshCw,
  Plus,
  PlayCircle,
  Activity,
  CheckCircle2,
  Clock,
  Terminal,
  Trash2,
} from 'lucide-react';

export const DeviceList = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newDevice, setNewDevice] = useState({
    deviceCode: 'DEV-02',
    name: 'Sports Complex Terminal',
    brand: 'ZKTeco',
    model: 'K40 / SilkBio',
    ipAddress: '192.168.1.202',
    port: 4370,
    location: 'North Block',
    communicationType: 'PUSH_RECEIVER',
    secretToken: 'device-secret-key-2',
  });

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await devicesApi.list();
      setDevices(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleSync = async (id) => {
    try {
      setSyncingId(id);
      const res = await devicesApi.sync(id);
      alert(`Sync finished: Health: ${res.data.health.isOnline ? 'Online' : 'Offline'}`);
      fetchDevices();
    } catch (e) {
      alert('Sync failed: ' + e.message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleViewLogs = async (id) => {
    try {
      const res = await devicesApi.logs(id);
      setSelectedLogs(res.data || []);
      setIsLogsOpen(true);
    } catch (e) {
      alert('Error fetching logs: ' + e.message);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      await devicesApi.create(newDevice);
      alert('Device added successfully!');
      setIsAddOpen(false);
      fetchDevices();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteDevice = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete biometric device "${name || id}"?`)) {
      return;
    }
    try {
      await devicesApi.delete(id);
      alert('Biometric device deleted successfully.');
      fetchDevices();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Biometric Devices & Hardware Terminals</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage biometric attendance machines, test communication adapters, and monitor raw punch ingestion
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Terminal</span>
          </button>
        </div>
      </div>

      {/* Device Cards */}
      {loading ? (
        <LoadingSpinner label="Detecting Biometric Hardware..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {devices.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Fingerprint className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{d.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {d.deviceCode} • {d.brand} {d.model}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Location</span>
                    <span className="font-medium text-slate-700">{d.location || 'Campus Gate'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mode</span>
                    <span className="font-mono text-slate-700">{d.communicationType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">IP Address</span>
                    <span className="font-mono text-slate-700">
                      {d.ipAddress ? `${d.ipAddress}:${d.port || 4370}` : 'Cloud Push Webhook'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mapped Staff</span>
                    <span className="font-semibold text-blue-600">{d._count?.deviceEmployeeMaps || 0} Teachers</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Last Sync: {d.lastSyncAt ? new Date(d.lastSyncAt).toLocaleString() : 'Never'}</span>
                  <span>Total Punches: {d._count?.rawPunches || 0}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewLogs(d.id)}
                    className="text-xs text-slate-600 hover:text-blue-600 font-semibold"
                  >
                    View Sync Logs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDevice(d.id || d.deviceCode, d.name)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer ml-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                <button
                  onClick={() => handleSync(d.id)}
                  disabled={syncingId === d.id}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncingId === d.id ? 'animate-spin' : ''}`} />
                  <span>{syncingId === d.id ? 'Connecting...' : 'Ping / Sync Device'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simulator Guidance Card */}
      <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-white font-bold text-sm mb-1">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <span>Biometric Hardware Simulator Script Available</span>
          </div>
          <p className="text-xs text-slate-400">
            To simulate real-time fingerprint/face clock-in and clock-out punches from biometric machines without physical hardware:
          </p>
          <code className="inline-block mt-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-emerald-400 text-xs">
            npm run simulate:punches
          </code>
        </div>
      </div>

      {/* Modal: Add Terminal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Biometric Terminal">
        <form onSubmit={handleAddDevice} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Device Name *</label>
            <input
              type="text"
              required
              value={newDevice.name}
              onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
              className="w-full p-2 border rounded-lg border-slate-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Device Code *</label>
              <input
                type="text"
                required
                value={newDevice.deviceCode}
                onChange={(e) => setNewDevice({ ...newDevice, deviceCode: e.target.value })}
                className="w-full p-2 border rounded-lg border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Brand / Model</label>
              <input
                type="text"
                value={newDevice.brand}
                onChange={(e) => setNewDevice({ ...newDevice, brand: e.target.value })}
                className="w-full p-2 border rounded-lg border-slate-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">IP Address (Optional)</label>
              <input
                type="text"
                value={newDevice.ipAddress}
                onChange={(e) => setNewDevice({ ...newDevice, ipAddress: e.target.value })}
                className="w-full p-2 border rounded-lg border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Port</label>
              <input
                type="number"
                value={newDevice.port}
                onChange={(e) => setNewDevice({ ...newDevice, port: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg border-slate-300 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 border rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
              Save Device
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Sync Logs */}
      <Modal isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} title="Device Sync History" maxWidth="max-w-2xl">
        <div className="space-y-3">
          {selectedLogs.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-xs">No sync logs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase border-b">
                  <tr>
                    <th className="py-2 px-3">Started At</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Fetched</th>
                    <th className="py-2 px-3">Inserted</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2 px-3 font-mono">{new Date(l.startedAt).toLocaleString()}</td>
                      <td className="py-2 px-3">{l.syncType}</td>
                      <td className="py-2 px-3 font-mono">{l.recordsFetched}</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-600">{l.recordsInserted}</td>
                      <td className="py-2 px-3">
                        <StatusBadge status={l.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

