import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera as CameraIcon,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  Users,
  Shield,
  Maximize2
} from 'lucide-react';
import { DetectionResult, DetectionItemResult, PositionStatus } from '@shared/types';

interface CameraFeedProps {
  detection: DetectionResult | null;
  isScanning: boolean;
  onFrameCapture?: (canvas: HTMLCanvasElement) => void;
  guidanceMessage?: string;
  cameraName?: string;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  detection,
  isScanning,
  onFrameCapture,
  guidanceMessage,
  cameraName = 'Kitchen Camera 01'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'loading' | 'active' | 'denied' | 'mock'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Start Real WebRTC Camera
  const startCamera = useCallback(async () => {
    setCameraState('loading');
    setErrorMessage('');

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setCameraState('active');
    } catch (err: any) {
      console.warn('Physical camera unavailable or permission denied, using simulation stream mode:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('denied');
        setErrorMessage('Camera access is required for PPE verification.');
      } else {
        // Fallback to high-definition animated simulated feed
        setCameraState('mock');
      }
    }
  }, [stream]);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Canvas drawing loop for bounding boxes, silhouette guide, and scanner HUD
  useEffect(() => {
    let frameCount = 0;

    const renderOverlay = () => {
      frameCount++;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. If in mock mode, draw simulated kitchen video backdrop
      if (cameraState === 'mock') {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#091322');
        grad.addColorStop(0.5, '#0f1f38');
        grad.addColorStop(1, '#080e1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Draw stainless steel kitchen shelf line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.4);
        ctx.lineTo(width, height * 0.4);
        ctx.stroke();

        // Draw animated worker silhouette if person is present in detection
        if (detection?.personDetected && !detection.multiplePeople) {
          const breathe = Math.sin(frameCount * 0.05) * 3;
          const centerX = width * 0.5;
          const headY = height * 0.22 + breathe;

          ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.lineWidth = 3;

          // Head (with Chef Hat / Hairnet indication)
          ctx.beginPath();
          ctx.arc(centerX, headY, 52, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Hair Cover / Chef Hat visual
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.beginPath();
          ctx.ellipse(centerX, headY - 20, 56, 32, 0, 0, Math.PI * 2);
          ctx.fill();

          // Torso / Apron body
          ctx.fillStyle = 'rgba(23, 37, 84, 0.8)';
          ctx.beginPath();
          ctx.moveTo(centerX - 95, height * 0.95);
          ctx.lineTo(centerX - 80, height * 0.42 + breathe);
          ctx.quadraticCurveTo(centerX, height * 0.38 + breathe, centerX + 80, height * 0.42 + breathe);
          ctx.lineTo(centerX + 95, height * 0.95);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Hands / Gloves positions
          ctx.fillStyle = 'rgba(52, 211, 153, 0.25)';
          ctx.beginPath();
          ctx.arc(centerX - 110, height * 0.65 + breathe, 24, 0, Math.PI * 2);
          ctx.arc(centerX + 110, height * 0.65 + breathe, 24, 0, Math.PI * 2);
          ctx.fill();
        } else if (detection?.multiplePeople) {
          // Draw 2 silhouettes
          ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.beginPath();
          ctx.arc(width * 0.35, height * 0.3, 40, 0, Math.PI * 2);
          ctx.arc(width * 0.65, height * 0.3, 40, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Draw Positioning Guide Bounding Target Box
      const guideX = width * 0.20;
      const guideY = height * 0.08;
      const guideW = width * 0.60;
      const guideH = height * 0.84;

      // Outer Corner brackets
      ctx.strokeStyle = detection?.personDetected
        ? (detection.multiplePeople ? '#ef4444' : '#10b981')
        : '#f59e0b';
      ctx.lineWidth = 3;
      const cornerLen = 28;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(guideX, guideY + cornerLen);
      ctx.lineTo(guideX, guideY);
      ctx.lineTo(guideX + cornerLen, guideY);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(guideX + guideW - cornerLen, guideY);
      ctx.lineTo(guideX + guideW, guideY);
      ctx.lineTo(guideX + guideW, guideY + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(guideX, guideY + guideH - cornerLen);
      ctx.lineTo(guideX, guideY + guideH);
      ctx.lineTo(guideX + cornerLen, guideY + guideH);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(guideX + guideW - cornerLen, guideY + guideH);
      ctx.lineTo(guideX + guideW, guideY + guideH);
      ctx.lineTo(guideX + guideW, guideY + guideH - cornerLen);
      ctx.stroke();

      // Subtle guide rectangle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      ctx.strokeRect(guideX, guideY, guideW, guideH);

      // 3. Scanning Laser Line Animation
      if (isScanning) {
        const scanY = (frameCount * 4) % height;
        const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
        scanGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
        scanGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.45)');
        scanGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');

        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 15, width, 30);

        ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(width, scanY);
        ctx.stroke();
      }

      // 4. Draw Real-Time Detected PPE Bounding Boxes
      if (detection?.items) {
        for (const [key, item] of Object.entries(detection.items)) {
          if (item.bbox) {
            const [bx, by, bw, bh] = item.bbox;
            const px = bx * width;
            const py = by * height;
            const pw = bw * width;
            const ph = bh * height;

            const isPassed = item.detected && item.confidence >= 0.85;
            const boxColor = isPassed ? '#10b981' : (item.detected ? '#f59e0b' : '#ef4444');

            // Draw bounding box
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(px, py, pw, ph);

            // Draw label background badge
            ctx.fillStyle = boxColor;
            const labelText = `${item.label || key}: ${Math.round(item.confidence * 100)}%`;
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            const textMetrics = ctx.measureText(labelText);
            const badgeW = textMetrics.width + 12;
            const badgeH = 20;

            ctx.fillRect(px, Math.max(0, py - badgeH), badgeW, badgeH);

            // Draw label text
            ctx.fillStyle = '#090d16';
            ctx.fillText(labelText, px + 6, Math.max(14, py - 5));
          }
        }
      }

      // Periodically invoke frame capture callback if provided
      if (onFrameCapture && frameCount % 30 === 0) {
        onFrameCapture(canvas);
      }

      animationFrameRef.current = requestAnimationFrame(renderOverlay);
    };

    animationFrameRef.current = requestAnimationFrame(renderOverlay);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [detection, isScanning, cameraState, onFrameCapture]);

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group select-none">
      
      {/* Background Live Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform -scale-x-100 ${
          cameraState === 'active' ? 'block' : 'hidden'
        }`}
      />

      {/* Overlay Canvas for Bounding Boxes, Silhouette Guide, and HUD */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Camera Header Status Bar */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono font-bold text-slate-200">{cameraName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {cameraState === 'active' ? 'LIVE' : 'SIMULATION'}
          </span>
        </div>

        {/* AI Confidence / Status Pill */}
        {detection && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow font-mono text-xs">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">
              {detection.inferenceTimeMs}ms inference
            </span>
          </div>
        )}
      </div>

      {/* Dynamic Positioning Guidance Alert Bar */}
      {guidanceMessage && (
        <div className="absolute top-14 inset-x-4 flex justify-center z-10 pointer-events-none animate-pulse-subtle">
          <div className="px-4 py-2 rounded-xl bg-amber-500/90 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>{guidanceMessage}</span>
          </div>
        </div>
      )}

      {/* Camera Permission Denied Overlay */}
      {cameraState === 'denied' && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-1">Camera Access Required</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
            {errorMessage || 'Camera access is required for PPE verification.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Camera Permission</span>
            </button>
            <button
              onClick={() => setCameraState('mock')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-all"
            >
              <span>Use Simulated Camera Feed</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Guidance Instruction Pill */}
      <div className="absolute bottom-3 inset-x-3 flex justify-center z-10 pointer-events-none">
        <div className="px-4 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-800 text-[11px] sm:text-xs text-slate-300 font-medium flex items-center gap-2 shadow">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span>Please stand inside the marked area with hands and upper body visible</span>
        </div>
      </div>

    </div>
  );
};
