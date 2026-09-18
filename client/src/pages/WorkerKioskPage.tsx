import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  User,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Camera as CameraIcon,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  HelpCircle,
  Delete
} from 'lucide-react';
import { CameraFeed } from '../components/CameraFeed';
import { PpeChecklist } from '../components/PpeChecklist';
import { VerificationResultModal } from '../components/VerificationResultModal';
import { DemoAiController } from '../components/DemoAiController';
import { detectorFactory } from '../ai/DetectorFactory';
import { soundService } from '../services/audio';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { Worker, DetectionResult, VerificationEvaluationResponse } from '@shared/types';

export const WorkerKioskPage: React.FC = () => {
  const { equipment, aiMode } = useSettings();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [workerInput, setWorkerInput] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isLoadingWorkers, setIsLoadingWorkers] = useState<boolean>(true);

  // Live AI Scanning & Detection state
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [guidanceMessage, setGuidanceMessage] = useState<string>('');
  const [verificationResponse, setVerificationResponse] = useState<VerificationEvaluationResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const canvasSnapshotRef = useRef<HTMLCanvasElement | null>(null);

  // Load active workers for quick picker
  useEffect(() => {
    setIsLoadingWorkers(true);
    api.getWorkers()
      .then(res => {
        setWorkers(res.workers.filter(w => w.status === 'active'));
      })
      .catch(err => console.error('Failed to load workers for kiosk:', err))
      .finally(() => setIsLoadingWorkers(false));
  }, []);

  // Continuous AI detection loop on camera
  useEffect(() => {
    let isCancelled = false;
    const detector = detectorFactory.getDetector(aiMode);

    const runDetection = async () => {
      if (isCancelled) return;
      try {
        const dummyCanvas = canvasSnapshotRef.current || document.createElement('canvas');
        const detResult = await detector.detect(dummyCanvas);

        if (!isCancelled) {
          setDetection(detResult);

          // Update guidance message based on position status
          if (!detResult.personDetected) {
            setGuidanceMessage('⚠ No person detected. Please step into the camera area.');
          } else if (detResult.multiplePeople) {
            setGuidanceMessage('⚠ Please ensure only one worker is in the camera area.');
          } else if (detResult.personPosition === 'too_far') {
            setGuidanceMessage('Please move closer to the camera.');
          } else if (detResult.personPosition === 'partial_out') {
            setGuidanceMessage('Please move fully inside the camera area.');
          } else {
            setGuidanceMessage('');
          }
        }
      } catch (err) {
        console.error('Detection loop error:', err);
      }

      if (!isCancelled) {
        setTimeout(runDetection, 120);
      }
    };

    runDetection();

    return () => {
      isCancelled = true;
    };
  }, [aiMode]);

  // Handle worker selection
  const handleSelectWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setWorkerInput(worker.workerCode);
    soundService.playClick();
  };

  // Handle keypad input
  const handleKeypadPress = (val: string) => {
    soundService.playClick();
    if (val === 'CLEAR') {
      setWorkerInput('');
      setSelectedWorker(null);
    } else if (val === 'BACK') {
      const next = workerInput.slice(0, -1);
      setWorkerInput(next);
      const match = workers.find(w => w.workerCode.toLowerCase() === next.toLowerCase());
      setSelectedWorker(match || null);
    } else {
      const next = workerInput.length < 8 ? workerInput + val : workerInput;
      setWorkerInput(next);
      const match = workers.find(w => w.workerCode.toLowerCase() === next.toLowerCase());
      setSelectedWorker(match || null);
    }
  };

  // Trigger verification check-in
  const handleVerify = async () => {
    const targetCode = workerInput.trim() || selectedWorker?.workerCode;
    if (!targetCode) {
      setGuidanceMessage('Please select or enter your Worker ID first.');
      return;
    }

    if (!detection) {
      setGuidanceMessage('Initializing AI camera vision...');
      return;
    }

    setIsVerifying(true);
    setIsScanning(true);

    try {
      // Small simulated scan delay for realistic feedback
      await new Promise(r => setTimeout(r, 600));

      const res = await api.submitVerification({
        workerId: targetCode,
        cameraId: 'cam_01',
        detection,
        durationMs: 1200
      });

      setVerificationResponse(res);

      if (res.result === 'PASS') {
        soundService.playPassChime();
      } else {
        soundService.playFailAlert();
      }
    } catch (err: any) {
      setGuidanceMessage(err.message || 'Verification error. Please retry.');
      soundService.playFailAlert();
    } finally {
      setIsVerifying(false);
      setIsScanning(false);
    }
  };

  const handleResetKiosk = () => {
    setVerificationResponse(null);
    setSelectedWorker(null);
    setWorkerInput('');
    setGuidanceMessage('');
  };

  const filteredWorkers = workers.filter(w =>
    `${w.firstName} ${w.lastName}`.toLowerCase().includes(searchFilter.toLowerCase()) ||
    w.workerCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
    w.department.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 p-4 sm:p-6 lg:p-8 grid-overlay">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                WORKER SAFETY REGISTRATION
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              AI camera verification for mandatory kitchen PPE before shift entry.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Camera & Checklist, Right Worker Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Live Camera & AI Scanner (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Live Camera Feed */}
            <CameraFeed
              detection={detection}
              isScanning={isScanning || isVerifying}
              guidanceMessage={guidanceMessage}
              cameraName="Entrance Scanner CAM-001"
              onFrameCapture={(canvas) => {
                canvasSnapshotRef.current = canvas;
              }}
            />

            {/* Checklist of required items */}
            <PpeChecklist
              requirements={equipment}
              detection={detection}
              isScanning={isScanning || isVerifying}
            />
          </div>

          {/* Right Column: Worker Identification & Verification Trigger (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Worker ID Card / Keypad Panel */}
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-slate-100 text-sm">Worker Identification</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 1 of 2</span>
              </div>

              {/* Selected Worker Preview */}
              {selectedWorker ? (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-950 text-sm shadow"
                      style={{ backgroundColor: selectedWorker.avatarColor || '#10b981' }}
                    >
                      {selectedWorker.firstName[0]}
                      {selectedWorker.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {selectedWorker.firstName} {selectedWorker.lastName}
                      </p>
                      <p className="text-xs text-emerald-400 font-mono">
                        {selectedWorker.workerCode} • {selectedWorker.department}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedWorker(null);
                      setWorkerInput('');
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                /* ID Input Field */
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Enter Worker Code (e.g. WK-1024)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type or click worker below..."
                      value={workerInput}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setWorkerInput(val);
                        const match = workers.find(w => w.workerCode.toLowerCase() === val.toLowerCase());
                        setSelectedWorker(match || null);
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base tracking-wider focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    {workerInput && (
                      <button
                        onClick={() => {
                          setWorkerInput('');
                          setSelectedWorker(null);
                        }}
                        className="absolute right-3 top-3.5 text-xs text-slate-500 hover:text-slate-300"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Numpad / Keypad for Touch Kiosk */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'WK-', '0', 'BACK'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeypadPress(key)}
                    className="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 font-mono font-bold text-sm border border-slate-700/60 active:scale-95 transition-all shadow-sm"
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Quick Worker Selector Carousel / List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Quick Worker Select</span>
                  <div className="relative w-40">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-8 pr-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                    />
                  </div>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {filteredWorkers.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => handleSelectWorker(w)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                        selectedWorker?.id === w.id
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                          : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-slate-950 text-[10px]"
                          style={{ backgroundColor: w.avatarColor || '#10b981' }}
                        >
                          {w.firstName[0]}
                        </div>
                        <span className="text-slate-200">{w.firstName} {w.lastName}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{w.workerCode}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Big VERIFY Button */}
              <button
                onClick={handleVerify}
                disabled={isVerifying || (!selectedWorker && !workerInput.trim())}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base tracking-wide shadow-xl shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>AI ANALYZING EQUIPMENT...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                    <span>VERIFY & CHECK IN</span>
                  </>
                )}
              </button>
            </div>

            {/* Privacy Guarantee Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Privacy & Safety Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                SafeKitchen AI strictly analyzes food-safety equipment. Zero facial recognition, biometric storage, or sensitive personal inference is performed.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Floating Demo AI Simulator Toolbar */}
      <DemoAiController />

      {/* Result Modal for PASS / FAIL / RETRY */}
      <VerificationResultModal
        response={verificationResponse}
        onClose={handleResetKiosk}
        onRetry={handleVerify}
      />
    </div>
  );
};
