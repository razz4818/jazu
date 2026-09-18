import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  Check,
  Percent,
  Sparkles,
  AlertTriangle,
  Info,
  ShieldCheck,
  CheckCircle2,
  Save,
  X
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { api } from '../services/api';
import { EquipmentRequirement } from '@shared/types';
import { IconRenderer } from '../components/IconRenderer';

export const AdminEquipmentPage: React.FC = () => {
  const { equipment, refreshEquipment } = useSettings();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentRequirement | null>(null);

  // New Equipment Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [minConfidence, setMinConfidence] = useState(85);
  const [icon, setIcon] = useState('Shield');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableIcons = ['Hand', 'UserCheck', 'Shield', 'Smile', 'Footprints', 'Eye', 'Glasses', 'HardHat'];

  const handleOpenAdd = () => {
    setName('');
    setDescription('');
    setIsRequired(true);
    setIsEnabled(true);
    setMinConfidence(85);
    setIcon('Shield');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: EquipmentRequirement) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setIsRequired(item.isRequired);
    setIsEnabled(item.isEnabled);
    setMinConfidence(Math.round(item.minConfidence * 100));
    setIcon(item.icon);
    setFormError('');
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Equipment name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createEquipment({
        name: name.trim(),
        description: description.trim(),
        isRequired,
        isEnabled,
        minConfidence: minConfidence / 100,
        icon
      });
      await refreshEquipment();
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      await api.updateEquipment(editingItem.id, {
        name: name.trim(),
        description: description.trim(),
        isRequired,
        isEnabled,
        minConfidence: minConfidence / 100,
        icon
      });
      await refreshEquipment();
      setEditingItem(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRequired = async (item: EquipmentRequirement) => {
    try {
      await api.updateEquipment(item.id, { isRequired: !item.isRequired });
      await refreshEquipment();
    } catch (err) {
      console.error('Failed to toggle required:', err);
    }
  };

  const handleToggleEnabled = async (item: EquipmentRequirement) => {
    try {
      await api.updateEquipment(item.id, { isEnabled: !item.isEnabled });
      await refreshEquipment();
    } catch (err) {
      console.error('Failed to toggle enabled:', err);
    }
  };

  const handleConfidenceChange = async (item: EquipmentRequirement, newPercent: number) => {
    try {
      await api.updateEquipment(item.id, { minConfidence: newPercent / 100 });
      await refreshEquipment();
    } catch (err) {
      console.error('Failed to update confidence:', err);
    }
  };

  const handleDelete = async (item: EquipmentRequirement) => {
    if (!confirm(`Are you sure you want to delete '${item.name}'?`)) return;
    try {
      await api.deleteEquipment(item.id);
      await refreshEquipment();
    } catch (err: any) {
      alert(err.message || 'Failed to delete equipment');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Equipment Safety Requirements
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Configure mandatory vs optional food-safety PPE, active items, and detection confidence thresholds.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Equipment</span>
        </button>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {equipment.map((item) => {
          const confidencePercent = Math.round(item.minConfidence * 100);

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 shadow-xl transition-all flex flex-col justify-between ${
                item.isEnabled
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-slate-950/70 border-slate-850 opacity-60'
              }`}
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
                      <IconRenderer name={item.icon || item.name} className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        {item.name}
                        {item.isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Custom
                          </span>
                        )}
                      </h3>
                      <span className="font-mono text-[11px] text-slate-500">code: {item.code}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Edit rule"
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {item.isCustom && (
                      <button
                        onClick={() => handleDelete(item)}
                        title="Delete custom rule"
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed mb-4 min-h-[36px]">
                  "{item.description}"
                </p>

                {/* Confidence Threshold Slider */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Minimum Confidence</span>
                    <span className="font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {confidencePercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="99"
                    value={confidencePercent}
                    onChange={(e) => handleConfidenceChange(item, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>50%</span>
                    <span>85% (Default)</span>
                    <span>99%</span>
                  </div>
                </div>
              </div>

              {/* Toggles (Required/Optional, Enabled/Disabled) */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {/* Required Switch */}
                <button
                  onClick={() => handleToggleRequired(item)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                    item.isRequired
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${item.isRequired ? 'bg-red-400' : 'bg-slate-500'}`}></span>
                  <span>{item.isRequired ? 'REQUIRED ●' : 'OPTIONAL'}</span>
                </button>

                {/* Enabled Switch */}
                <button
                  onClick={() => handleToggleEnabled(item)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                    item.isEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${item.isEnabled ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                  <span>{item.isEnabled ? 'ENABLED' : 'DISABLED'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Equipment Modal */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingItem ? 'Edit Equipment Requirement' : 'Add Custom Equipment'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
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

            <form onSubmit={editingItem ? handleSaveEdit : handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Equipment Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beard Net, Cut-Resistant Glove"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Worker must wear approved sanitary beard net."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableIcons.map((ic) => (
                    <button
                      type="button"
                      key={ic}
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                        icon === ic
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      <IconRenderer name={ic} className="w-4 h-4" />
                      <span>{ic}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Minimum Confidence Threshold</span>
                  <span className="font-mono text-emerald-400 font-bold">{minConfidence}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Switches */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span>Mandatory / Required</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span>Rule Enabled</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
