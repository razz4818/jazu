import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Video,
  Volume2,
  VolumeX,
  Cpu,
  LogOut,
  User,
  LayoutDashboard,
  Store,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const Navbar: React.FC = () => {
  const { user, restaurant, logout, isAuthenticated } = useAuth();
  const { aiMode, setAiMode, soundEnabled, toggleSound } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const isKiosk = location.pathname === '/kiosk' || location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <Link to="/kiosk" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white">SafeKitchen</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none">
                {restaurant?.name || 'Commercial Food Safety'}
              </p>
            </div>
          </Link>

          {/* Restaurant Badge */}
          <div className="hidden md:flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-800 text-xs text-slate-400">
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium text-slate-300">{restaurant?.name}</span>
          </div>
        </div>

        {/* Global Controls & Mode Switchers */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* AI Mode Selector Toggle */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700/60 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-slate-400" />
              AI:
            </span>
            <button
              onClick={() => setAiMode('demo')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                aiMode === 'demo'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DEMO
            </button>
            <button
              onClick={() => setAiMode('real')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                aiMode === 'real'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-slate-950 shadow-sm shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              REAL
            </button>
          </div>

          {/* Audio Chimes Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Chimes' : 'Enable Audio Feedback'}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* View Switcher: Kiosk vs Admin */}
          {isKiosk ? (
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all hover:border-slate-600"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Admin Portal</span>
            </Link>
          ) : (
            <Link
              to="/kiosk"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>Worker Kiosk</span>
            </Link>
          )}

          {/* User Profile / Login */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-emerald-400 uppercase font-mono">{user?.role}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                title="Logout"
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin Login</span>
            </Link>
          )}

        </div>
      </div>
    </header>
  );
};
