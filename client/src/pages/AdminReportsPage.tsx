import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  Calendar,
  ShieldAlert,
  Percent,
  Download,
  Filter,
  Sparkles,
  PieChart
} from 'lucide-react';
import { api } from '../services/api';
import { ReportsData } from '@shared/types';

export const AdminReportsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReports(timeframe, startDate, endDate);
      setReport(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [timeframe, startDate, endDate]);

  const maxDailyTotal = report?.dailyTrend?.reduce((max, d) => Math.max(max, d.total), 1) || 1;

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Safety Compliance Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Audit trends, pass/fail ratios, and most frequently missing kitchen equipment.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'custom', label: 'Custom' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  timeframe === t.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {timeframe === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Total Scanned
          </span>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {isLoading ? '...' : report?.totalRegistrations || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total verification attempts</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
            Passed Registrations
          </span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400">
            {isLoading ? '...' : report?.passedCount || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Fully compliant check-ins</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-400 font-mono">
            Failed Attempts
          </span>
          <div className="mt-2 text-3xl font-extrabold text-red-400">
            {isLoading ? '...' : report?.failedCount || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Gear missing or below threshold</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-mono">
            Overall Compliance
          </span>
          <div className="mt-2 text-3xl font-extrabold text-teal-300">
            {isLoading ? '...' : `${report?.complianceRate || 100}%`}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">Industry standard &gt;85%</p>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Daily Registrations Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100 text-sm">Registrations by Day</h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Passed
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span> Failed
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
            {report?.dailyTrend && report.dailyTrend.length > 0 ? (
              report.dailyTrend.map((d, i) => {
                const totalHeightPercent = Math.max((d.total / maxDailyTotal) * 100, 6);
                const passHeightPercent = (d.passed / d.total) * 100;
                const failHeightPercent = (d.failed / d.total) * 100;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-white shadow z-10 pointer-events-none whitespace-nowrap">
                      {d.date}: {d.passed} pass, {d.failed} fail ({d.complianceRate}%)
                    </div>

                    <div
                      className="w-full max-w-[42px] rounded-t-lg overflow-hidden flex flex-col justify-end bg-slate-800/80 transition-all hover:brightness-110"
                      style={{ height: `${totalHeightPercent}%` }}
                    >
                      <div
                        className="w-full bg-red-500"
                        style={{ height: `${failHeightPercent}%` }}
                      />
                      <div
                        className="w-full bg-emerald-500"
                        style={{ height: `${passHeightPercent}%` }}
                      />
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 mt-2 truncate w-full text-center">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                No trend data available for selected period.
              </div>
            )}
          </div>
        </div>

        {/* Most Frequently Missing PPE (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-slate-100 text-sm">Most Frequently Missing PPE</h3>
          </div>

          <div className="space-y-3 pt-2">
            {report?.missingPpeFrequency && report.missingPpeFrequency.length > 0 ? (
              report.missingPpeFrequency.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <span className="font-mono text-red-400 font-bold">
                      {item.count} misses ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 font-mono text-xs">
                No missing PPE recorded in this timeframe!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Department Compliance Breakdown Table */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl p-5 space-y-4">
        <h3 className="font-bold text-slate-100 text-sm">Department Compliance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Total Scans</th>
                <th className="py-3 px-4 text-center text-emerald-400">Passed</th>
                <th className="py-3 px-4 text-center text-red-400">Failed</th>
                <th className="py-3 px-4 text-right">Compliance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {report?.departmentBreakdown && report.departmentBreakdown.length > 0 ? (
                report.departmentBreakdown.map((dept, i) => (
                  <tr key={i} className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-semibold text-white">{dept.department}</td>
                    <td className="py-3 px-4 text-center font-mono">{dept.total}</td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-400">{dept.passed}</td>
                    <td className="py-3 px-4 text-center font-mono text-red-400">{dept.failed}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {dept.complianceRate}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-mono text-xs">
                    No department data.
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
