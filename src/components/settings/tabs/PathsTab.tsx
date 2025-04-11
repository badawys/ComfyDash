import React, { useState } from 'react';
import { FiHardDrive, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useSettings } from '@/contexts/SettingsContext';

export const PathsTab: React.FC = () => {
  const { settings, setSettings } = useSettings();
  const [newPathName, setNewPathName] = useState('');
  const [newPathValue, setNewPathValue] = useState('');

  const handleAddCustomPath = () => {
    if (!newPathName.trim() || !newPathValue.trim()) {
      return;
    }

    // Create a new custom paths object if it doesn't exist
    const customPaths = settings.customPaths || {};
    
    // Add the new path
    const updatedCustomPaths = {
      ...customPaths,
      [newPathName]: newPathValue
    };
    
    // Update the settings
    setSettings({
      ...settings,
      customPaths: updatedCustomPaths
    });
    
    // Clear the input fields
    setNewPathName('');
    setNewPathValue('');
  };

  const handleRemoveCustomPath = (pathName: string) => {
    const customPaths = { ...settings.customPaths };
    delete customPaths[pathName];
    
    setSettings({
      ...settings,
      customPaths
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 flex items-center">
          <FiHardDrive className="mr-2" />
          Path Settings
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
          Configure paths for ComfyUI, models, and custom nodes.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="comfyUIPath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ComfyUI Path
          </label>
          <input
            type="text"
            id="comfyUIPath"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Enter the path to ComfyUI"
            value={settings.comfyUIPath || ''}
            onChange={(e) => setSettings({ ...settings, comfyUIPath: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The path to your ComfyUI installation.
          </p>
        </div>
        
        <div>
          <label htmlFor="modelsPath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Models Path
          </label>
          <input
            type="text"
            id="modelsPath"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Enter the path to models"
            value={settings.modelsPath || ''}
            onChange={(e) => setSettings({ ...settings, modelsPath: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The path to your models directory.
          </p>
        </div>
        
        <div>
          <label htmlFor="customNodesPath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Nodes Path
          </label>
          <input
            type="text"
            id="customNodesPath"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Enter the path to custom nodes"
            value={settings.customNodesPath || ''}
            onChange={(e) => setSettings({ ...settings, customNodesPath: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The path to your custom nodes directory.
          </p>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-lg font-medium mb-4">Custom Paths</h4>
          
          <div className="space-y-4">
            {settings.customPaths && Object.entries(settings.customPaths).map(([name, path]) => (
              <div key={name} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{path}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomPath(name)}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="md:col-span-1">
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Path Name"
                  value={newPathName}
                  onChange={(e) => setNewPathName(e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Path Value"
                  value={newPathValue}
                  onChange={(e) => setNewPathValue(e.target.value)}
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAddCustomPath}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
                  disabled={!newPathName.trim() || !newPathValue.trim()}
                >
                  <FiPlus className="mr-2" />
                  Add Path
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
