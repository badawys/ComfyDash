import React from 'react';
import { TabType } from '@/types/settings';
import { FiSettings, FiServer, FiHardDrive, FiCpu, FiDownload } from 'react-icons/fi';
import { IoMdColorPalette } from 'react-icons/io';
import { MdSecurity } from 'react-icons/md';

interface SettingsTabNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const SettingsTabNav: React.FC<SettingsTabNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-4 overflow-x-auto pb-1" aria-label="Settings tabs">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center whitespace-nowrap py-2 px-3 border-b-2 text-sm font-medium ${
            activeTab === 'general'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <FiSettings className="mr-2" />
          General
        </button>
        
        <button
          onClick={() => setActiveTab('paths')}
          className={`flex items-center whitespace-nowrap py-2 px-3 border-b-2 text-sm font-medium ${
            activeTab === 'paths'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <FiHardDrive className="mr-2" />
          Paths
        </button>
        
        <button
          onClick={() => setActiveTab('server')}
          className={`flex items-center whitespace-nowrap py-2 px-3 border-b-2 text-sm font-medium ${
            activeTab === 'server'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <FiServer className="mr-2" />
          Server
        </button>
        
        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center whitespace-nowrap py-2 px-3 border-b-2 text-sm font-medium ${
            activeTab === 'appearance'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <IoMdColorPalette className="mr-2" />
          Appearance
        </button>
        
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center whitespace-nowrap py-2 px-3 border-b-2 text-sm font-medium ${
            activeTab === 'monitoring'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <FiCpu className="mr-2" />
          Monitoring
        </button>
        
        <button
          onClick={() => setActiveTab('api-keys')}
          className={`flex items-center whitespace-nowrap py-2 px-3 border-b-2 text-sm font-medium ${
            activeTab === 'api-keys'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <MdSecurity className="mr-2" />
          API Keys
        </button>
        
        <button
          onClick={() => setActiveTab('import-export')}
          className={`flex items-center whitespace-nowrap py-2 px-3 border-b-2 text-sm font-medium ${
            activeTab === 'import-export'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <FiDownload className="mr-2" />
          Import/Export
        </button>
      </nav>
    </div>
  );
};
