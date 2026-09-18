import React, { createContext, useContext, useState, useEffect } from 'react';
import { EquipmentRequirement, RestaurantSettings, AIMode } from '@shared/types';
import { api } from '../services/api';
import { soundService } from '../services/audio';

interface SettingsContextType {
  settings: RestaurantSettings | null;
  equipment: EquipmentRequirement[];
  aiMode: AIMode;
  soundEnabled: boolean;
  isLoading: boolean;
  setAiMode: (mode: AIMode) => Promise<void>;
  toggleSound: () => void;
  refreshSettings: () => Promise<void>;
  refreshEquipment: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [equipment, setEquipment] = useState<EquipmentRequirement[]>([]);
  const [aiMode, setAiModeState] = useState<AIMode>('demo');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [settRes, eqRes] = await Promise.allSettled([
        api.getSettings(),
        api.getEquipment()
      ]);

      if (settRes.status === 'fulfilled') {
        setSettings(settRes.value.settings);
        setAiModeState(settRes.value.settings.aiMode || 'demo');
      }

      if (eqRes.status === 'fulfilled') {
        setEquipment(eqRes.value.equipment);
      }
    } catch (err) {
      console.error('Error loading settings/equipment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setAiMode = async (mode: AIMode) => {
    setAiModeState(mode);
    try {
      await api.updateSettings({ aiMode: mode });
    } catch (err) {
      console.warn('Could not save AI mode setting to server:', err);
    }
  };

  const toggleSound = () => {
    const updated = soundService.toggleSound();
    setSoundEnabled(updated);
  };

  const refreshSettings = async () => {
    try {
      const res = await api.getSettings();
      setSettings(res.settings);
      setAiModeState(res.settings.aiMode || 'demo');
    } catch {}
  };

  const refreshEquipment = async () => {
    try {
      const res = await api.getEquipment();
      setEquipment(res.equipment);
    } catch {}
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        equipment,
        aiMode,
        soundEnabled,
        isLoading,
        setAiMode,
        toggleSound,
        refreshSettings,
        refreshEquipment
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
