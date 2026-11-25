import React, { useState, useEffect } from 'react';
import { usersApi } from '../../api/endpoints.js';
import { useAuth } from '../../store/authContext.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import {
  Users,
  Search,
  Key,
  Shield,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  User,
  GraduationCap,
  Lock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export const UserList = () => {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Edit Credentials Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    isActive: true,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await usersApi.list({ search, role: roleFilter === 'ALL' ? undefined : roleFilter });
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      isActive: u.isActive,
    });
    setShowPassword(false);
    setIsEditOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        isActive: formData.isActive,
      };

      // Only pass password if provided
      if (formData.password && formData.password.trim().length >= 6) {
        payload.password = formData.password.trim();
      }

      // Only pass role if changed and user has permission
      if (isSuperAdmin && formData.role !== selectedUser.role) {
        payload.role = formData.role;
      }

      await usersApi.update(selectedUser.id, payload);
      alert(`Credentials for ${selectedUser.name} updated successfully!`);
      setIsEditOpen(false);
      fetchUsers();
    } catch (err) {
      alert('Error updating credentials: ' + (err?.message || 'Check inputs'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u) => {
    const action = u.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} the user account for ${u.name}?`)) return;
    try {
      await usersApi.toggleStatus(u.id, !u.isActive);
      fetchUsers();
    } catch (err) {
      alert('Error toggling status: ' + err.message);
    }
  };

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.isActive).length;
  const teacherCount = users.filter((u) => u.role === 'TEACHER').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Key className="h-6 w-6 text-blue-600" />
            <span>User Credentials & Account Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administer login credentials, reset passwords, change emails, and manage permissions for all system accounts.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase">Total Users</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase">Active Accounts</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase">Teachers Enrolled</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{teacherCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase">Administrators</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{adminCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Administrator</option>
            <option value="TEACHER">Teacher</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner label="Loading user accounts..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Login Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Linked Profile</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Created On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No user accounts found matching query.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                              {u.name?.slice(0, 2) || 'US'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {u.name} {isSelf && <span className="text-[10px] text-blue-600 font-normal">(You)</span>}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {u.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${u.role === 'SUPER_ADMIN'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : u.role === 'ADMIN'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                          >
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.employee ? (
                            <div>
                              <span className="font-mono text-xs font-bold text-blue-700">
                                {u.employee.employeeId}
                              </span>
                              <span className="block text-[10px] text-slate-500">{u.employee.designation}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Direct Administrator</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                              <CheckCircle className="h-3 w-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                              <XCircle className="h-3 w-3" />
                              <span>Suspended</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{u.createdAt?.slice(0, 10)}</td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => openEditModal(u)}
                            title="Edit Credentials / Reset Password"
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Key className="h-3.5 w-3.5" />
                            <span>Edit Credentials</span>
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              title={u.isActive ? 'Suspend User' : 'Activate User'}
                              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${u.isActive
                                  ? 'text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                            >
                              {u.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </button>
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

      {/* Modal: Edit Credentials */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Credentials: ${selectedUser?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Account Role:</span>
              <span className="font-bold text-slate-800">{selectedUser?.role}</span>
            </div>
            {selectedUser?.employee && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Employee ID:</span>
                <span className="font-mono font-bold text-blue-700">{selectedUser.employee.employeeId}</span>
              </div>
            )}
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Login Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 border rounded-lg border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Used by user to sign in to the portal. Syncs automatically with employee record.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Reset Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-blue-600 hover:underline flex items-center space-x-1"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Leave blank to keep unchanged (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2.5 border rounded-lg border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Enter a new secure password if you want to reset this user's password.
            </p>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Assigned Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-2.5 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-700">Account Active Status</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default UserList;
