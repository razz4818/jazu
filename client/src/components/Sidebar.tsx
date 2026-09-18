import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  Camera,
  History,
  BarChart3,
  Settings,
  ExternalLink,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const Sidebar: React.FC = () => {
  const { settings } = useSettings();

  const links = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/equipment', icon: ShieldAlert, label: 'Equipment Rules' },
    { to: '/admin/workers', icon: Users, label: 'Workers' },
    { to: '/admin/cameras', icon: Camera, label: 'Cameras' },
    { to: '/admin/history', icon: History, label: 'Registration Log' },
    { to: '/admin/reports', icon: BarChart3, label: 'Compliance Reports' },
    { to: '/admin/settings', icon: Settings, label: 'Restaurant Settings' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        
        {/* Restaurant Header snippet */}
        <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">Organization</p>
            <p className="text-sm font-bold text-slate-100 truncate">{settings?.restaurantName || 'Demo Kitchen'}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Active</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-2">
            Administration
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Quick Kiosk Mode launcher */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <NavLink
          to="/kiosk"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all group"
        >
          <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Launch AI Kiosk</span>
          <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
        </NavLink>

        <div className="text-[11px] text-slate-400 text-center font-mono">
          SafeKitchen AI v1.0 • Privacy-First
        </div>
      </div>
    </aside>
  );
};
