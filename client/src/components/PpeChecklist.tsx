import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { EquipmentRequirement, DetectionResult } from '@shared/types';
import { IconRenderer } from './IconRenderer';

interface PpeChecklistProps {
  requirements: EquipmentRequirement[];
  detection: DetectionResult | null;
  isScanning: boolean;
}

export const PpeChecklist: React.FC<PpeChecklistProps> = ({
  requirements,
  detection,
  isScanning
}) => {
  const activeReqs = requirements.filter(r => r.isEnabled);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-slate-100 text-sm tracking-wide">
            Mandatory Safety Checklist
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {activeReqs.filter(r => r.isRequired).length} Required Items
        </span>
      </div>

      <div className="space-y-2.5">
        {activeReqs.map((req) => {
          const itemKey = req.code;
          const detectedItem = detection?.items?.[itemKey] || detection?.items?.[itemKey.toLowerCase().replace(/[\s-]/g, '_')];
          const isDetected = detectedItem ? Boolean(detectedItem.detected) : false;
          const confidence = detectedItem?.confidence || 0;
          const meetsThreshold = isDetected && confidence >= req.minConfidence;

          let statusState: 'checking' | 'passed' | 'failed' | 'optional_missing' = 'checking';

          if (isScanning || !detection) {
            statusState = 'checking';
          } else if (meetsThreshold) {
            statusState = 'passed';
          } else if (req.isRequired) {
            statusState = 'failed';
          } else {
            statusState = 'optional_missing';
          }

          return (
            <div
              key={req.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                statusState === 'passed'
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : statusState === 'failed'
                  ? 'bg-red-950/25 border-red-500/40 text-red-300'
                  : 'bg-slate-850/60 border-slate-800 text-slate-300'
              }`}
            >
              {/* Item Info */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    statusState === 'passed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : statusState === 'failed'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <IconRenderer name={req.icon || req.name} className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-100">{req.name}</span>
                    {req.isRequired ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                        Required
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-800 text-slate-400">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                    {req.description}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 text-right">
                {statusState === 'checking' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-medium">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking...</span>
                  </div>
                )}

                {statusState === 'passed' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ {Math.round(confidence * 100)}%</span>
                  </div>
                )}

                {statusState === 'failed' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold">
                    <XCircle className="w-4 h-4" />
                    <span>✕ Missing</span>
                  </div>
                )}

                {statusState === 'optional_missing' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Optional</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
