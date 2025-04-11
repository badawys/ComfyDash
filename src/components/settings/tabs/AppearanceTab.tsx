import React from 'react';
import { IoMdColorPalette } from 'react-icons/io';
import { useSettings } from '@/contexts/SettingsContext';

export const AppearanceTab: React.FC = () => {
  const { settings, setSettings } = useSettings();

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 flex items-center">
          <IoMdColorPalette className="mr-2" />
          Appearance Settings
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
          Customize the look and feel of the application.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Theme
          </label>
          <select
            id="theme"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            value={settings.theme || 'system'}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' | 'system' })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Choose the theme for the application interface.
          </p>
        </div>
        
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
            onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Set the refresh interval for system stats display (minimum: 100ms).
          </p>
        </div>
      </div>
    </div>
  );
};
