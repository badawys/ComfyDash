import React from 'react';
import { FiCpu } from 'react-icons/fi';
import { useSettings } from '@/contexts/SettingsContext';

export const MonitoringTab: React.FC = () => {
  const { settings, setSettings, availableGpus, loadingGpus, availableStorageLocations, loadingStorage } = useSettings();

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 flex items-center">
          <FiCpu className="mr-2" />
          Monitoring Settings
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
          Configure system monitoring preferences.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="refreshInterval" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Refresh Interval (ms)
          </label>
          <input
            type="number"
            id="refreshInterval"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="1000"
            min="100"
            value={settings.refreshInterval || 1000}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              // Ensure minimum refresh interval of 100ms to prevent excessive API calls
              const validValue = isNaN(value) || value < 100 ? 100 : value;
              setSettings({ ...settings, refreshInterval: validValue });
            }}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            How frequently to refresh system stats (in milliseconds). Minimum: 100ms.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="gpuMonitoringEnabled" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable GPU Monitoring
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Monitor GPU usage and display stats in the dashboard.
            </p>
          </div>
          <div className="ml-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="gpuMonitoringEnabled"
                className="sr-only peer"
                checked={settings.gpuMonitoringEnabled || false}
                onChange={(e) => setSettings({ ...settings, gpuMonitoringEnabled: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div>
          <label htmlFor="selectedGpuId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Selected GPU
          </label>
          <select
            id="selectedGpuId"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            value={settings.selectedGpuId || ''}
            onChange={(e) => setSettings({ ...settings, selectedGpuId: e.target.value })}
            disabled={loadingGpus}
          >
            <option value="">Select a GPU</option>
            {availableGpus.map((gpu) => (
              <option key={gpu.id} value={gpu.id}>
                {gpu.name} ({gpu.driver})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Select the GPU to monitor.
          </p>
        </div>
        
        <div>
          <label htmlFor="selectedStoragePath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Selected Storage Path
          </label>
          <select
            id="selectedStoragePath"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            value={settings.selectedStoragePath || ''}
            onChange={(e) => setSettings({ ...settings, selectedStoragePath: e.target.value })}
            disabled={loadingStorage}
          >
            <option value="">Select a Storage Path</option>
            {availableStorageLocations.map((location) => (
              <option key={location.id} value={location.path}>
                {location.path} ({location.free_gb.toFixed(2)} GB free of {location.total_gb.toFixed(2)} GB)
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Select the storage path to monitor.
          </p>
        </div>
      </div>
    </div>
  );
};
