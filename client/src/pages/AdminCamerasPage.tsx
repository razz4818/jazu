import React, { useState, useEffect } from 'react';
import {
  Camera as CameraIcon,
  Plus,
  Radio,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Activity,
  Sparkles,
  X,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Camera } from '@shared/types';

export const AdminCamerasPage: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);

  // Form fields
  const [cameraCode, setCameraCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'online' | 'offline'>('online');
  const [resolution, setResolution] = useState('1080p');
  const [ipAddress, setIpAddress] = useState('192.168.1.105');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCameras = async () => {
    try {
      const res = await api.getCameras();
      setCameras(res.cameras);
    } catch (err) {
      console.error('Failed to fetch cameras:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleOpenAdd = () => {
    setCameraCode(`CAM-00${cameras.length + 1}`);
    setName('');
    setLocation('');
    setStatus('online');
    setResolution('1080p');
    setIpAddress(`192.168.1.${100 + cameras.length + 1}`);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cam: Camera) => {
    setEditingCamera(cam);
    setCameraCode(cam.cameraCode);
    setName(cam.name);
    setLocation(cam.location);
    setStatus(cam.status as any);
    setResolution(cam.resolution || '1080p');
    setIpAddress(cam.ipAddress || '192.168.1.101');
    setFormError('');
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cameraCode.trim() || !name.trim() || !location.trim()) {
      setFormError('Camera code, name, and location are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createCamera({
        cameraCode: cameraCode.trim().toUpperCase(),
        name: name.trim(),
        location: location.trim(),
        status
      });
      await fetchCameras();
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add camera');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCamera) return;
    setIsSubmitting(true);
    try {
      await api.updateCamera(editingCamera.id, {
        cameraCode: cameraCode.trim().toUpperCase(),
        name: name.trim(),
        location: location.trim(),
        status,
        resolution,
        ipAddress
      });
      await fetchCameras();
      setEditingCamera(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update camera');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cam: Camera) => {
    if (!confirm(`Are you sure you want to remove camera '${cam.name}' (${cam.cameraCode})?`)) return;
    try {
      await api.deleteCamera(cam.id);
      await fetchCameras();
    } catch (err: any) {
      alert(err.message || 'Failed to delete camera');
    }
  };

  const handlePing = async (cam: Camera) => {
    try {
      await fetch(`/api/cameras/${cam.id}/heartbeat`, {
        method: 'POST',
        headers: {
          'x-restaurant-id': localStorage.getItem('safekitchen_tenant_id') || 'rest_demokitchen_001'
        }
      });
      await fetchCameras();
    } catch (err) {
      console.error('Ping error:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Kitchen Camera Checkpoints
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage vision AI cameras deployed at restaurant entrance, prep stations, and walk-in checkpoints.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Camera</span>
        </button>
      </div>

      {/* Camera Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cameras.map((cam) => {
          const isOnline = cam.status === 'online';

          return (
            <div
              key={cam.id}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${
                      isOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <CameraIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{cam.name}</h3>
                      <span className="font-mono text-xs font-bold text-emerald-400">{cam.cameraCode}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cam)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Edit Camera"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cam)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove Camera"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Location & IP Details */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-200 font-medium">{cam.location}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">Resolution:</span>
                    <span className="text-slate-300">{cam.resolution || '1080p @ 30fps'}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">IP Address:</span>
                    <span className="text-slate-300">{cam.ipAddress || '192.168.1.101'}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">Last Active:</span>
                    <span className="text-slate-300">{new Date(cam.lastActiveAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Status and Heartbeat Action */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                  </span>
                  <span className={`text-xs font-mono font-bold ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                    ● {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                <button
                  onClick={() => handlePing(cam)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Ping</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Camera Modal */}
      {(isAddModalOpen || editingCamera) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingCamera ? 'Edit Camera' : 'Add Kitchen Camera'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCamera(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={editingCamera ? handleSaveEdit : handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Camera Code (e.g. CAM-001)
                </label>
                <input
                  type="text"
                  required
                  value={cameraCode}
                  onChange={(e) => setCameraCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Camera Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Kitchen Entrance Main"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location Zone
                </label>
                <input
                  type="text"
                  required
                  placeholder="Station 1 Main Entrance"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="4K">4K Ultra HD</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCamera(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingCamera ? 'Save Changes' : 'Add Camera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
