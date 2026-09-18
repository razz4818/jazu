import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  XCircle,
  Percent,
  Camera,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '@shared/types';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 15s
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Restaurant Compliance Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time shift verification metrics, camera status, and safety compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/kiosk"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Launch Kiosk</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Today's Registrations */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Today's Registrations
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {isLoading ? '...' : stats?.todayRegistrations || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">total scans</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Across {stats?.totalCamerasCount || 1} checkpoints
          </div>
        </div>

        {/* Card 2: Successful */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
              Successful
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {isLoading ? '...' : stats?.successfulRegistrations || 0}
            </span>
            <span className="text-xs text-emerald-500/80 font-medium">verified</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Cleared for kitchen shift
          </div>
        </div>

        {/* Card 3: Failed */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400 font-mono">
              Failed
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-400">
              {isLoading ? '...' : stats?.failedRegistrations || 0}
            </span>
            <span className="text-xs text-red-500/80 font-medium">missing gear</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Prompted to wear missing PPE
          </div>
        </div>

        {/* Card 4: Compliance Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-mono">
              Compliance
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-300">
              {isLoading ? '...' : `${stats?.compliancePercentage || 100}%`}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Target: &gt;85%</span>
          </div>
        </div>

        {/* Card 5: Camera Status */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Camera Status
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xl font-bold text-emerald-400 font-mono">ONLINE</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            {stats?.camerasOnlineCount || 1} / {stats?.totalCamerasCount || 1} Active
          </div>
        </div>

      </div>

      {/* Main Table: Recent Registration Feed */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold text-slate-100 text-base">Recent Check-In Activity</h2>
              <p className="text-xs text-slate-400">Live feed of worker PPE scans across all stations</p>
            </div>
          </div>

          <Link
            to="/admin/history"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>View Full Log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-5">Worker ID</th>
                <th className="py-3.5 px-5">Worker Name</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Time</th>
                <th className="py-3.5 px-5">Result</th>
                <th className="py-3.5 px-5">Missing PPE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    Loading registrations...
                  </td>
                </tr>
              ) : stats?.recentRegistrations && stats.recentRegistrations.length > 0 ? (
                stats.recentRegistrations.map((reg) => {
                  const isPass = reg.result === 'PASS';
                  const missingList = reg.missingRequired || [];

                  return (
                    <tr key={reg.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-200">
                        {reg.workerCode}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-100">
                        {reg.workerName}
                      </td>
                      <td className="py-3.5 px-5 text-slate-400">
                        {reg.department}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-400 text-xs">
                        {formatDate(reg.timestamp)}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-400 text-xs">
                        {formatTime(reg.timestamp)}
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
                        {isPass || missingList.length === 0 ? (
                          <span className="text-slate-500 font-mono">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {missingList.map((m, i) => (
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
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    No recent check-in registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
