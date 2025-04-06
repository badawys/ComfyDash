"use client";

import { useState, useEffect } from 'react';
import { getSettings, updateSettings, exportSettings, importSettings } from '@/services/settingsService';
import { fetchSystemStats, fetchSystemInfo, fetchStorageInfo } from '@/services/systemService';
import axios from 'axios';

// Interface for GPU information
interface GpuInfo {
  id: string;
  name: string;
  driver: string;
}

// Interface for storage location information
interface StorageLocation {
  id: string;
  path: string;
  device: string;
  fstype: string;
  total_gb: number;
  used_gb: number;
  free_gb: number;
  percent_used: number;
}

interface Settings {
  civitaiApiKey?: string;
  huggingfaceApiKey?: string;
  comfyUIPath?: string;
  modelsPath?: string;
  customNodesPath?: string;
  customPaths?: Record<string, string>;
  autoUpdateCustomNodes?: boolean;
  startComfyUIOnBoot?: boolean;
  gpuMonitoringEnabled?: boolean;
  theme?: 'light' | 'dark' | 'system';
  refreshInterval?: number;
  selectedGpuId?: string;
  selectedStoragePath?: string;
}

export default function SettingsManager() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPathName, setNewPathName] = useState('');
  const [newPathValue, setNewPathValue] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [availableGpus, setAvailableGpus] = useState<GpuInfo[]>([]);
  const [availableStorageLocations, setAvailableStorageLocations] = useState<StorageLocation[]>([]);
  const [loadingGpus, setLoadingGpus] = useState(false);
  const [loadingStorage, setLoadingStorage] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchAvailableGpusList();
    fetchAvailableStorageLocationsList();
  }, []);

  const fetchAvailableGpusList = async () => {
    try {
      setLoadingGpus(true);
      const response = await axios.get('/api/system/available-gpus');
      setAvailableGpus(response.data);
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
      const response = await axios.get('/api/system/available-storage');
      setAvailableStorageLocations(response.data);
    } catch (error: any) {
      console.error('Error fetching available storage locations:', error);
      // Return a default storage location in case of error
      setAvailableStorageLocations([{
        id: '0',
        path: '/',
        device: 'Default',
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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSettings();
      setSettings(data);
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await updateSettings(settings);
      
      setSuccess('Settings saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomPath = () => {
    if (!newPathName.trim() || !newPathValue.trim()) {
      setError('Both name and path are required for custom paths');
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      customPaths: {
        ...prev.customPaths,
        [newPathName.trim()]: newPathValue.trim()
      }
    }));
    
    setNewPathName('');
    setNewPathValue('');
    setError(null);
  };

  const handleRemoveCustomPath = (pathName: string) => {
    setSettings(prev => {
      const customPaths = { ...prev.customPaths };
      delete customPaths[pathName];
      return { ...prev, customPaths };
    });
  };

  const handleExport = async () => {
    try {
      setError(null);
      const response = await exportSettings();
      
      // The exportSettings function already handles the download
      // No need to create a download link here
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to export settings');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setError('Please select a file to import');
      return;
    }
    
    try {
      setError(null);
      setSaving(true);
      
      await importSettings(importFile);
      
      // Refresh settings
      await fetchSettings();
      
      setSuccess('Settings imported successfully');
      setImportFile(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to import settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300 rounded-md">
          {success}
        </div>
      )}
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">API Keys</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="civitaiApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CivitAI API Key
            </label>
            <input
              type="password"
              id="civitaiApiKey"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Enter your CivitAI API key"
              value={settings.civitaiApiKey || ''}
              onChange={(e) => setSettings({ ...settings, civitaiApiKey: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Get your API key from <a href="https://civitai.com/user/account" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">CivitAI</a>
            </p>
          </div>
          
          <div>
            <label htmlFor="huggingfaceApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              HuggingFace API Key
            </label>
            <input
              type="password"
              id="huggingfaceApiKey"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Enter your HuggingFace API key"
              value={settings.huggingfaceApiKey || ''}
              onChange={(e) => setSettings({ ...settings, huggingfaceApiKey: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Get your API key from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">HuggingFace</a>
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Paths</h2>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="comfyUIPath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ComfyUI Path
            </label>
            <input
              type="text"
              id="comfyUIPath"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="/path/to/comfyui"
              value={settings.comfyUIPath || ''}
              onChange={(e) => setSettings({ ...settings, comfyUIPath: e.target.value })}
            />
          </div>
          
          <div>
            <label htmlFor="modelsPath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Models Path
            </label>
            <input
              type="text"
              id="modelsPath"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="/path/to/models"
              value={settings.modelsPath || ''}
              onChange={(e) => setSettings({ ...settings, modelsPath: e.target.value })}
            />
          </div>
          
          <div>
            <label htmlFor="customNodesPath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom Nodes Path
            </label>
            <input
              type="text"
              id="customNodesPath"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="/path/to/custom_nodes"
              value={settings.customNodesPath || ''}
              onChange={(e) => setSettings({ ...settings, customNodesPath: e.target.value })}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Custom Paths</h2>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label htmlFor="newPathName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Path Name
              </label>
              <input
                type="text"
                id="newPathName"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="e.g., Checkpoints"
                value={newPathName}
                onChange={(e) => setNewPathName(e.target.value)}
              />
            </div>
            
            <div className="flex-1">
              <label htmlFor="newPathValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Path Value
              </label>
              <input
                type="text"
                id="newPathValue"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="/path/to/checkpoints"
                value={newPathValue}
                onChange={(e) => setNewPathValue(e.target.value)}
              />
            </div>
            
            <div className="self-end">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleAddCustomPath}
              >
                Add Path
              </button>
            </div>
          </div>
          
          {Object.keys(settings.customPaths || {}).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Path
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {Object.entries(settings.customPaths || {}).map(([name, path]) => (
                    <tr key={name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {path}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRemoveCustomPath(name)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No custom paths defined. Add one above.
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">General Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoUpdateCustomNodes"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={settings.autoUpdateCustomNodes || false}
              onChange={(e) => setSettings({ ...settings, autoUpdateCustomNodes: e.target.checked })}
            />
            <label htmlFor="autoUpdateCustomNodes" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Auto-update custom nodes on startup
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="startComfyUIOnBoot"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={settings.startComfyUIOnBoot || false}
              onChange={(e) => setSettings({ ...settings, startComfyUIOnBoot: e.target.checked })}
            />
            <label htmlFor="startComfyUIOnBoot" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Start ComfyUI automatically on system boot
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="gpuMonitoringEnabled"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={settings.gpuMonitoringEnabled || false}
              onChange={(e) => setSettings({ ...settings, gpuMonitoringEnabled: e.target.checked })}
            />
            <label htmlFor="gpuMonitoringEnabled" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Enable GPU monitoring (may affect performance)
            </label>
          </div>
          
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Theme
            </label>
            <select
              id="theme"
              className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              value={settings.theme || 'system'}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' | 'system' })}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="refreshInterval" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stats Refresh Interval (ms)
            </label>
            <div className="flex items-center">
              <input
                type="number"
                id="refreshInterval"
                className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                value={settings.refreshInterval || 1000}
                onChange={(e) => setSettings({ ...settings, refreshInterval: Math.max(100, parseInt(e.target.value)) })}
                min="100"
                step="100"
              />
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                (Minimum: 100ms)
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="selectedGpuId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              GPU for Stats Display
            </label>
            <select
              id="selectedGpuId"
              className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              value={settings.selectedGpuId || '0'}
              onChange={(e) => setSettings({ ...settings, selectedGpuId: e.target.value })}
              disabled={loadingGpus || availableGpus.length === 0}
            >
              {loadingGpus ? (
                <option value="">Loading GPUs...</option>
              ) : (
                availableGpus.map((gpu) => (
                  <option key={gpu.id} value={gpu.id}>
                    {gpu.name}
                  </option>
                ))
              )}
            </select>
            {availableGpus.length === 0 && !loadingGpus && (
              <p className="mt-1 text-sm text-red-500">
                No GPUs detected. Using default GPU.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="selectedStoragePath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Storage Location for Stats Display
            </label>
            <select
              id="selectedStoragePath"
              className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              value={settings.selectedStoragePath || ''}
              onChange={(e) => setSettings({ ...settings, selectedStoragePath: e.target.value })}
              disabled={loadingStorage || availableStorageLocations.length === 0}
            >
              <option value="">Default (System Drive)</option>
              {loadingStorage ? (
                <option value="">Loading Storage Locations...</option>
              ) : (
                availableStorageLocations.map((location) => (
                  <option key={location.id} value={location.path}>
                    {location.path} ({location.total_gb.toFixed(1)} GB)
                  </option>
                ))
              )}
            </select>
            {availableStorageLocations.length === 0 && !loadingStorage && (
              <p className="mt-1 text-sm text-red-500">
                No storage locations detected. Using system drive.
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Import/Export</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            onClick={handleExport}
          >
            Export Settings
          </button>
          
          <div className="flex-1">
            <input
              type="file"
              id="importFile"
              className="hidden"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
            <div className="flex space-x-2">
              <label
                htmlFor="importFile"
                className="cursor-pointer px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Select File
              </label>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                onClick={handleImport}
                disabled={!importFile || saving}
              >
                {saving ? 'Importing...' : 'Import Settings'}
              </button>
            </div>
            {importFile && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Selected file: {importFile.name}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
