import React from 'react';
import { MdSecurity } from 'react-icons/md';
import { useSettings } from '@/contexts/SettingsContext';

export const ApiKeysTab: React.FC = () => {
  const { settings, setSettings } = useSettings();

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 flex items-center">
          <MdSecurity className="mr-2" />
          API Keys
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
          Configure API keys for various services.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="civitaiApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Civitai API Key
          </label>
          <input
            type="password"
            id="civitaiApiKey"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Enter your Civitai API key"
            value={settings.civitaiApiKey || ''}
            onChange={(e) => setSettings({ ...settings, civitaiApiKey: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Used for accessing Civitai models and services.
          </p>
        </div>
        
        <div>
          <label htmlFor="huggingfaceApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hugging Face API Key
          </label>
          <input
            type="password"
            id="huggingfaceApiKey"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Enter your Hugging Face API key"
            value={settings.huggingfaceApiKey || ''}
            onChange={(e) => setSettings({ ...settings, huggingfaceApiKey: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Used for accessing Hugging Face models and services.
          </p>
        </div>
      </div>
    </div>
  );
};
