import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  ShieldCheck,
  History,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Worker, VerificationAttempt } from '@shared/types';

export const AdminWorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals & History drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [selectedWorkerHistory, setSelectedWorkerHistory] = useState<{ worker: Worker; history: VerificationAttempt[] } | null>(null);

  // Form fields
  const [workerCode, setWorkerCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [deptField, setDeptField] = useState('Prep Kitchen');
  const [avatarColor, setAvatarColor] = useState('#10b981');
  const [statusField, setStatusField] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = ['Prep Kitchen', 'Grill Line', 'Pastry & Bakery', 'Sous Chef / Expo', 'Line Cook', 'Sanitation & Stewarding', 'Salad & Cold Station'];
  const colors = ['#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#06b6d4', '#14b8a6', '#84cc16'];

  const fetchWorkers = async () => {
    try {
      const res = await api.getWorkers(search, department);
      setWorkers(res.workers);
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [search, department]);

  const handleOpenAdd = () => {
    setWorkerCode(`WK-${Math.floor(1000 + Math.random() * 9000)}`);
    setFirstName('');
    setLastName('');
    setDeptField('Prep Kitchen');
    setAvatarColor('#10b981');
    setStatusField('active');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (w: Worker) => {
    setEditingWorker(w);
    setWorkerCode(w.workerCode);
    setFirstName(w.firstName);
    setLastName(w.lastName);
    setDeptField(w.department);
    setAvatarColor(w.avatarColor || '#10b981');
    setStatusField(w.status);
    setFormError('');
  };

  const handleOpenHistory = async (w: Worker) => {
    try {
      const res = await api.getWorker(w.id);
      setSelectedWorkerHistory(res);
    } catch (err: any) {
      alert(err.message || 'Failed to load history');
    }
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerCode.trim() || !firstName.trim() || !lastName.trim()) {
      setFormError('All fields are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createWorker({
        workerCode: workerCode.trim().toUpperCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        department: deptField,
        avatarColor
      });
      await fetchWorkers();
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create worker');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    setIsSubmitting(true);
    try {
      await api.updateWorker(editingWorker.id, {
        workerCode: workerCode.trim().toUpperCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        department: deptField,
        avatarColor,
        status: statusField
      });
      await fetchWorkers();
      setEditingWorker(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update worker');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (worker: Worker) => {
    const nextStatus = worker.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateWorker(worker.id, { status: nextStatus });
      await fetchWorkers();
    } catch (err) {
      console.error('Failed to toggle worker status:', err);
    }
  };

  const handleDeleteWorker = async (worker: Worker) => {
    if (!confirm(`Are you sure you want to remove worker ${worker.workerCode} (${worker.firstName} ${worker.lastName})?`)) return;
    try {
      await api.deleteWorker(worker.id);
      await fetchWorkers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete worker');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Kitchen Staff Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage restaurant personnel, assigned departments, and individual PPE verification history.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Worker</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search worker by name, code, dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Department:</span>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-5">Worker ID</th>
                <th className="py-3.5 px-5">Name</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Last Verification</th>
                <th className="py-3.5 px-5 text-center">Registrations</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    Loading staff directory...
                  </td>
                </tr>
              ) : workers.length > 0 ? (
                workers.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-white">
                      {w.workerCode}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-950 text-xs shadow-sm"
                          style={{ backgroundColor: w.avatarColor || '#10b981' }}
                        >
                          {w.firstName[0]}
                          {w.lastName[0]}
                        </div>
                        <span className="font-semibold text-slate-100">{w.firstName} {w.lastName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-300 font-medium">
                      {w.department}
                    </td>
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => handleToggleStatus(w)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono transition-all ${
                          w.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${w.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                        <span>{w.status === 'active' ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-5">
                      {w.lastVerification ? (
                        <div className="flex items-center gap-1.5">
                          {w.lastVerification.result === 'PASS' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="text-xs font-mono text-slate-300">
                            {w.lastVerification.result}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">No scans yet</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-200">
                      {w.registrationCount || 0}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenHistory(w)}
                          title="View Check-In History"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-400 transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(w)}
                          title="Edit Worker"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorker(w)}
                          title="Remove Worker"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    No workers match criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Worker Modal */}
      {(isAddModalOpen || editingWorker) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingWorker ? 'Edit Worker Profile' : 'Add Kitchen Worker'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingWorker(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={editingWorker ? handleSaveEdit : handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Worker ID / Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WK-1024"
                  value={workerCode}
                  onChange={(e) => setWorkerCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Elena"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Gomez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <select
                  value={deptField}
                  onChange={(e) => setDeptField(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Avatar Color</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform ${avatarColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {editingWorker && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={statusField}
                    onChange={(e) => setStatusField(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingWorker(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingWorker ? 'Save Changes' : 'Add Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Worker Registration History Drawer Modal */}
      {selectedWorkerHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-950 text-sm shadow"
                  style={{ backgroundColor: selectedWorkerHistory.worker.avatarColor || '#10b981' }}
                >
                  {selectedWorkerHistory.worker.firstName[0]}
                  {selectedWorkerHistory.worker.lastName[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedWorkerHistory.worker.firstName} {selectedWorkerHistory.worker.lastName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedWorkerHistory.worker.workerCode} • {selectedWorkerHistory.worker.department}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedWorkerHistory(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {selectedWorkerHistory.history.length > 0 ? (
                selectedWorkerHistory.history.map((h) => {
                  const isPass = h.result === 'PASS';
                  const missing = h.missingRequired || [];
                  return (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {isPass ? (
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                            ✓
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center font-bold">
                            ✕
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            {isPass ? 'Registration Succeeded' : 'Registration Failed'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {new Date(h.timestamp).toLocaleString()} • {h.cameraName || 'Main Camera'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {isPass ? (
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                            All PPE Detected
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-red-400">
                            Missing: {missing.join(', ') || 'Required Gear'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-500 font-mono text-xs">
                  No verification history recorded for this worker yet.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedWorkerHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
