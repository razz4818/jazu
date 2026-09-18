import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Clock,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { VerificationEvaluationResponse } from '@shared/types';
import { IconRenderer } from './IconRenderer';

interface VerificationResultModalProps {
  response: VerificationEvaluationResponse | null;
  onClose: () => void;
  onRetry: () => void;
}

export const VerificationResultModal: React.FC<VerificationResultModalProps> = ({
  response,
  onClose,
  onRetry
}) => {
  if (!response) return null;

  const isPass = response.result === 'PASS';
  const isNeedsRetry = response.result === 'NEEDS_RETRY';

  const [countdown, setCountdown] = useState<number>(isPass ? 8 : 15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose, isPass]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return new Date().toLocaleTimeString();
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-xl rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl border transition-all ${
          isPass
            ? 'glass-panel-glow border-emerald-500/40 bg-slate-900/95 text-slate-100'
            : isNeedsRetry
            ? 'bg-slate-900/95 border-amber-500/40 text-slate-100'
            : 'glass-panel-glow-red border-red-500/40 bg-slate-900/95 text-slate-100'
        }`}
      >
        {/* Header Result Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            {isPass ? (
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce-subtle">
                <CheckCircle className="w-12 h-12 text-emerald-400 stroke-[2.5]" />
              </div>
            ) : isNeedsRetry ? (
              <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <AlertTriangle className="w-12 h-12 text-amber-400 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center shadow-lg shadow-red-500/30">
                <XCircle className="w-12 h-12 text-red-400 stroke-[2.5]" />
              </div>
            )}
          </div>

          <h2
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isPass ? 'text-emerald-400' : isNeedsRetry ? 'text-amber-400' : 'text-red-400'
            }`}
          >
            {response.statusTitle}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
            {response.message}
          </p>
        </div>

        {/* Worker Info Card */}
        {response.worker && (
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-slate-950 text-sm shadow"
                style={{ backgroundColor: response.worker.avatarColor || '#10b981' }}
              >
                {response.worker.firstName[0]}
                {response.worker.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {response.worker.firstName} {response.worker.lastName}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  {response.worker.department} • <span className="font-mono text-emerald-400">{response.worker.workerCode}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3 text-slate-400" />
                Time
              </p>
              <p className="text-xs font-mono font-bold text-slate-200">
                {formatTime(response.timestamp)}
              </p>
            </div>
          </div>
        )}

        {/* Breakdown of Missing & Detected PPE Items */}
        <div className="space-y-4 mb-6">
          
          {/* Missing Required Items (if FAIL) */}
          {response.missingItems && response.missingItems.length > 0 && (
            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30">
              <p className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Missing Required Equipment:
              </p>
              <div className="flex flex-wrap gap-2">
                {response.missingItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-200 font-semibold text-xs border border-red-500/40"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detected Items */}
          {response.detectedItems && response.detectedItems.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Detected Equipment:
              </p>
              <div className="flex flex-wrap gap-2">
                {response.detectedItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-medium text-xs border border-emerald-500/30"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {isPass ? (
            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all"
            >
              <span>CONTINUE</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-xs font-mono opacity-80">({countdown}s)</span>
            </button>
          ) : (
            <>
              <button
                onClick={onRetry}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>TRY AGAIN</span>
              </button>
              <button
                onClick={onClose}
                className="py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all"
              >
                Done
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
