import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles,
  Zap
} from 'lucide-react';
import { DemoSimulationPreset } from '@shared/types';
import { detectorFactory } from '../ai/DetectorFactory';

interface DemoAiControllerProps {
  onPresetChange?: (preset: DemoSimulationPreset) => void;
}

export const DemoAiController: React.FC<DemoAiControllerProps> = ({ onPresetChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<DemoSimulationPreset>('ALL_COMPLIANT');

  const demoDetector = detectorFactory.getDemoDetector();

  const handleSelectPreset = (preset: DemoSimulationPreset) => {
    setActivePreset(preset);
    demoDetector.setPreset(preset);
    if (onPresetChange) {
      onPresetChange(preset);
    }
  };

  const presets: { id: DemoSimulationPreset; label: string; icon: any; color: string; desc: string }[] = [
    {
      id: 'ALL_COMPLIANT',
      label: 'All PPE Detected (PASS)',
      icon: CheckCircle,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      desc: 'Gloves 96%, Hair Cover 94%, Apron 92%'
    },
    {
      id: 'MISSING_GLOVES',
      label: 'Gloves Missing (FAIL)',
      icon: XCircle,
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      desc: 'Gloves not detected on hands'
    },
    {
      id: 'MISSING_HAIR_COVER',
      label: 'Hair Cover Missing (FAIL)',
      icon: XCircle,
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      desc: 'No hairnet or chef hat detected'
    },
    {
      id: 'MISSING_APRON',
      label: 'Apron Missing (FAIL)',
      icon: XCircle,
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      desc: 'Apron missing on torso'
    },
    {
      id: 'MULTIPLE_MISSING',
      label: 'Multiple PPE Missing (FAIL)',
      icon: XCircle,
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      desc: 'Gloves & Apron both missing'
    },
    {
      id: 'LOW_CONFIDENCE',
      label: 'Low Confidence (FAIL)',
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      desc: 'Gloves at 68% (Below 85% requirement)'
    },
    {
      id: 'NO_PERSON',
      label: 'No Person Detected (RETRY)',
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      desc: 'Empty camera frame'
    },
    {
      id: 'MULTIPLE_PEOPLE',
      label: 'Multiple People in Area (RETRY)',
      icon: Users,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      desc: '2+ workers standing in detection zone'
    },
    {
      id: 'TOO_FAR',
      label: 'Person Too Far (RETRY)',
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      desc: 'Worker standing beyond optimal range'
    },
    {
      id: 'PARTIAL_OUT',
      label: 'Partial Out of Frame (RETRY)',
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      desc: 'Hands or head outside camera zone'
    }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full transition-all">
      {/* Collapsed Trigger Pill */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="ml-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-850 text-slate-200 border border-emerald-500/40 shadow-xl shadow-slate-950/60 transition-all hover:scale-105 group"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold font-mono">Demo AI Simulator</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ) : (
        /* Expanded Floating Toolbar */
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-slate-100 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">AI Vision Simulation</h4>
                <p className="text-[10px] text-slate-400">Test pass/fail verification scenarios</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {presets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? `${preset.color} font-semibold shadow-sm`
                      : 'bg-slate-850/60 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <p className="font-semibold text-slate-100 truncate">{preset.label}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{preset.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 text-center font-mono">
            Active: <span className="text-emerald-400 font-bold">{activePreset}</span>
          </div>
        </div>
      )}
    </div>
  );
};
