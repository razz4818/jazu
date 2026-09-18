import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Eye,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { VerificationAttempt } from '@shared/types';
import { IconRenderer } from '../components/IconRenderer';

export const AdminHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<VerificationAttempt[]>([]);
  const [resultFilter, setResultFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [selectedAttempt, setSelectedAttempt] = useState<VerificationAttempt | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await api.getHistory(resultFilter, deptFilter, search, 100);
      setHistory(res.history);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [resultFilter, deptFilter, search]);

  const departments = ['Prep Kitchen', 'Grill Line', 'Pastry & Bakery', 'Sous Chef / Expo', 'Line Cook', 'Sanitation & Stewarding', 'Salad & Cold Station'];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Registration Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Complete audit trail of all AI food-safety equipment scans, confidence ratings, and outcomes.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          Showing {history.length} audit records
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by worker code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Result Filter Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {['ALL', 'PASS', 'FAIL'].map((res) => (
              <button
                key={res}
                onClick={() => setResultFilter(res)}
                className={`px-3 py-1 rounded-lg transition-all font-bold ${
                  resultFilter === res
                    ? res === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : res === 'FAIL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {res}
              </button>
            ))}
          </div>

          {/* Department dropdown */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-5">Worker</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Camera</th>
                <th className="py-3.5 px-5">Result</th>
                <th className="py-3.5 px-5">Missing PPE</th>
                <th className="py-3.5 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    Loading registration history...
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history.map((h) => {
                  const isPass = h.result === 'PASS';
                  const missing = h.missingRequired || [];

                  return (
                    <tr key={h.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div>
                          <p className="font-bold text-white text-xs sm:text-sm">{h.workerName}</p>
                          <p className="font-mono text-emerald-400 text-[11px]">{h.workerCode}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-300 font-medium">
                        {h.department}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-400 text-xs">
                        {new Date(h.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-400 text-xs">
                        {h.cameraName || 'Main Camera'}
                      </td>
                      <td className="py-3.5 px-5">
                        {isPass ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] bg-red-500/15 text-red-400 border border-red-500/30">
                            <XCircle className="w-3 h-3" />
                            FAIL
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {isPass || missing.length === 0 ? (
                          <span className="text-slate-500 font-mono">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {missing.map((m, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded font-semibold text-[11px] bg-red-500/20 text-red-300 border border-red-500/30"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedAttempt(h)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center gap-1.5 ml-auto transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Snapshot</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    No verification records found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attempt Snapshot Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                  selectedAttempt.result === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {selectedAttempt.result === 'PASS' ? '✓' : '✕'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Verification Snapshot</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedAttempt.id}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAttempt(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Worker & Camera Header */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400">Worker:</p>
                <p className="font-bold text-white">{selectedAttempt.workerName}</p>
                <p className="font-mono text-emerald-400 text-[11px]">{selectedAttempt.workerCode}</p>
              </div>
              <div>
                <p className="text-slate-400">Camera Station:</p>
                <p className="font-bold text-slate-200">{selectedAttempt.cameraName}</p>
                <p className="font-mono text-slate-400 text-[11px]">{new Date(selectedAttempt.timestamp).toLocaleString()}</p>
              </div>
            </div>

            {/* Item Confidence Snapshot Table */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                PPE Confidence Breakdown
              </p>

              <div className="space-y-2">
                {Object.values(selectedAttempt.items || {}).map((item: any, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <IconRenderer name={item.code} className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-200">{item.name}</span>
                      {item.required ? (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-red-500/10 text-red-400 font-mono">
                          Required
                        </span>
                      ) : (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                          Optional
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400 text-[11px]">Threshold: {Math.round(item.threshold * 100)}%</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                        item.passed
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {item.detected ? `${Math.round(item.confidence * 100)}%` : 'Not Detected'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
