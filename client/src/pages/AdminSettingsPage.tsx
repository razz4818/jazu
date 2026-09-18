import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Shield,
  Clock,
  Cpu,
  Lock,
  Globe,
  CheckCircle,
  AlertCircle,
  Info,
  Server
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { api } from '../services/api';

export const AdminSettingsPage: React.FC = () => {
  const { settings, refreshSettings, setAiMode } = useSettings();

  const [restaurantName, setRestaurantName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [defaultConfidence, setDefaultConfidence] = useState(85);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(3);
  const [verificationTimeoutSec, setVerificationTimeoutSec] = useState(15);
  const [requireHandsVisible, setRequireHandsVisible] = useState(true);
  const [requireHeadVisible, setRequireHeadVisible] = useState(true);
  const [allowSnapshotStorage, setAllowSnapshotStorage] = useState(false);
  const [aiModeField, setAiModeField] = useState<'demo' | 'real'>('demo');
  const [realModelEndpoint, setRealModelEndpoint] = useState('');
  const [realModelApiKey, setRealModelApiKey] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (settings) {
      setRestaurantName(settings.restaurantName || 'Demo Kitchen');
      setLogoUrl(settings.logoUrl || '');
      setTimezone(settings.timezone || 'America/New_York');
      setDefaultConfidence(Math.round((settings.defaultMinConfidence || 0.85) * 100));
      setMaxFailedAttempts(settings.maxFailedAttemptsWarning || 3);
      setVerificationTimeoutSec(settings.verificationTimeoutSec || 15);
      setRequireHandsVisible(settings.requireHandsVisible);
      setRequireHeadVisible(settings.requireHeadVisible);
      setAllowSnapshotStorage(settings.allowSnapshotStorage);
      setAiModeField(settings.aiMode || 'demo');
      setRealModelEndpoint(settings.realModelEndpoint || '');
      setRealModelApiKey(settings.realModelApiKey || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    setErrorMessage('');

    try {
      await api.updateSettings({
        restaurantName: restaurantName.trim(),
        logoUrl,
        timezone,
        defaultMinConfidence: defaultConfidence / 100,
        maxFailedAttemptsWarning: maxFailedAttempts,
        verificationTimeoutSec,
        requireHandsVisible,
        requireHeadVisible,
        allowSnapshotStorage,
        aiMode: aiModeField,
        realModelEndpoint: realModelEndpoint.trim(),
        realModelApiKey: realModelApiKey.trim()
      });
      await setAiMode(aiModeField);
      await refreshSettings();
      setSaveMessage('Restaurant settings updated successfully!');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Dubai'
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Restaurant Settings & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          General restaurant profile, AI vision mode, verification thresholds, and privacy policies.
        </p>
      </div>

      {saveMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: General Info */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Restaurant Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Verification Behavior & Thresholds */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Verification Behavior
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Confidence Threshold
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="99"
                  value={defaultConfidence}
                  onChange={(e) => setDefaultConfidence(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                />
                <span className="text-xs text-slate-400 font-mono">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Failed Scans Warning
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxFailedAttempts}
                onChange={(e) => setMaxFailedAttempts(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Verification Timeout (Seconds)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={verificationTimeoutSec}
                onChange={(e) => setVerificationTimeoutSec(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={requireHandsVisible}
                onChange={(e) => setRequireHandsVisible(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Require both hands visible in camera frame</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={requireHeadVisible}
                onChange={(e) => setRequireHeadVisible(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Require upper body and head visible</span>
            </label>
          </div>
        </div>

        {/* Section 3: AI Model & Real Detector Bridge */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            AI Computer Vision Mode
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAiModeField('demo')}
              className={`p-4 rounded-xl border text-left transition-all ${
                aiModeField === 'demo'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-white">Demo Vision Mode</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">ACTIVE</span>
              </div>
              <p className="text-xs text-slate-400">
                Simulate full pass/fail verification scenarios without requiring an external GPU/model server.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAiModeField('real')}
              className={`p-4 rounded-xl border text-left transition-all ${
                aiModeField === 'real'
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-white">Real AI Vision Model</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">YOLO/Roboflow</span>
              </div>
              <p className="text-xs text-slate-400">
                Connect directly to an on-premise YOLO server, Roboflow model API, or cloud vision endpoint.
              </p>
            </button>
          </div>

          {aiModeField === 'real' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Model Endpoint URL
                </label>
                <input
                  type="text"
                  placeholder="https://vision-api.restaurant.internal/v1/detect"
                  value={realModelEndpoint}
                  onChange={(e) => setRealModelEndpoint(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API Key (Optional)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={realModelApiKey}
                  onChange={(e) => setRealModelApiKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Privacy & Compliance Policy */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-3">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Privacy by Design Guarantee
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            SafeKitchen AI operates under strict privacy protections:
          </p>

          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li>Zero facial recognition algorithms or biometric worker indexing.</li>
            <li>No inference of age, gender, ethnicity, emotional state, or sensitive attributes.</li>
            <li>Camera video frames are processed ephemerally in volatile memory for equipment detection.</li>
          </ul>

          <label className="flex items-center gap-2.5 pt-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={allowSnapshotStorage}
              onChange={(e) => setAllowSnapshotStorage(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Allow ephemeral low-res verification failure snapshots for manager review</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
