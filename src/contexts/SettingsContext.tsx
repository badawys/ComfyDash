import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Settings, GpuInfo, StorageLocation, ServerStatus } from '@/types/settings';
import { getSettings, updateSettings } from '@/services/settingsService';
import { serverService } from '@/services/serverService';
import { monitoringService } from '@/services/monitoringService';

interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  serverStatus: ServerStatus;
  serverActionInProgress: boolean;
  availableGpus: GpuInfo[];
  availableStorageLocations: StorageLocation[];
  loadingGpus: boolean;
  loadingStorage: boolean;
  settingsFileError: string | null;
  fetchSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  checkServerStatus: () => Promise<void>;
  fetchAvailableGpusList: () => Promise<void>;
  fetchAvailableStorageLocationsList: () => Promise<void>;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setServerActionInProgress: (inProgress: boolean) => void;
  setSettingsFileError: (error: string | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('unknown');
  const [serverActionInProgress, setServerActionInProgress] = useState(false);
  const [availableGpus, setAvailableGpus] = useState<GpuInfo[]>([]);
  const [availableStorageLocations, setAvailableStorageLocations] = useState<StorageLocation[]>([]);
  const [loadingGpus, setLoadingGpus] = useState(false);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [settingsFileError, setSettingsFileError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchAvailableGpusList();
    fetchAvailableStorageLocationsList();
    checkServerStatus();
    
    // Check server status every 5 seconds
    const intervalId = setInterval(checkServerStatus, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const fetchAvailableGpusList = async () => {
    try {
      setLoadingGpus(true);
      const gpus = await monitoringService.getAvailableGpus();
      setAvailableGpus(gpus);
    } catch (error: any) {
      console.error('Error fetching available GPUs:', error);
      // Return a default GPU in case of error
      setAvailableGpus([{
        id: '0',
        name: 'Default GPU',
        driver: 'Unknown'
      }]);
    } finally {
      setLoadingGpus(false);
    }
  };

  const fetchAvailableStorageLocationsList = async () => {
    try {
      setLoadingStorage(true);
      const storageLocations = await monitoringService.getAvailableStorageLocations();
      setAvailableStorageLocations(storageLocations);
    } catch (error: any) {
      console.error('Error fetching available storage locations:', error);
      // Return a default storage location in case of error
      setAvailableStorageLocations([{
        id: '0',
        path: '/',
        device: 'Unknown',
        fstype: 'Unknown',
        total_gb: 0,
        used_gb: 0,
        free_gb: 0,
        percent_used: 0
      }]);
    } finally {
      setLoadingStorage(false);
    }
  };

  const checkServerStatus = async () => {
    try {
      const status = await serverService.getStatus();
      setServerStatus(status);
    } catch (error) {
      console.error('Error checking server status:', error);
      setServerStatus('unknown');
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await updateSettings(settings);
      setSuccess('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const value = {
    settings,
    setSettings,
    loading,
    saving,
    error,
    success,
    serverStatus,
    serverActionInProgress,
    availableGpus,
    availableStorageLocations,
    loadingGpus,
    loadingStorage,
    settingsFileError,
    fetchSettings,
    saveSettings,
    checkServerStatus,
    fetchAvailableGpusList,
    fetchAvailableStorageLocationsList,
    setError,
    setSuccess,
    setServerActionInProgress,
    setSettingsFileError
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
