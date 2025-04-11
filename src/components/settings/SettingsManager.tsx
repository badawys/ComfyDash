"use client";

import React, { useState } from 'react';
import { TabType } from '@/types/settings';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { SettingsTabNav } from './SettingsTabNav';
import { 
  GeneralTab, 
  PathsTab, 
  ServerTab, 
  AppearanceTab, 
  MonitoringTab, 
  ApiKeysTab, 
  ImportExportTab 
} from './tabs';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const SettingsManagerContent: React.FC = () => {
  const { loading, error, success, saving, saveSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<TabType>('general');

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading settings...</div>;
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md space-y-8">
      {error && (
        <div className="p-4 bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300 rounded-md flex items-center gap-2">
          <FiAlertTriangle className="text-xl flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300 rounded-md flex items-center gap-2">
          <FiCheckCircle className="text-xl flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}
      
      {/* Tab Navigation */}
      <SettingsTabNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'paths' && <PathsTab />}
        {activeTab === 'server' && <ServerTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'monitoring' && <MonitoringTab />}
        {activeTab === 'api-keys' && <ApiKeysTab />}
        {activeTab === 'import-export' && <ImportExportTab />}
      
        {/* Save Button */}
        <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SettingsManager() {
  return (
    <SettingsProvider>
      <SettingsManagerContent />
    </SettingsProvider>
  );
}
