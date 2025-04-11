import React, { useState } from 'react';
import { FiDownload, FiUpload, FiPackage, FiImage, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useSettings } from '@/contexts/SettingsContext';
import { exportSettings, importSettings, checkMissingItems } from '@/services/settingsService';
import { installCustomNode } from '@/services/customNodesService';
import { downloadModel } from '@/services/modelService';

export const ImportExportTab: React.FC = () => {
  const { settings, setSettings, setError, setSuccess, fetchSettings, saving } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [missingCustomNodes, setMissingCustomNodes] = useState<any[]>([]);
  const [missingModels, setMissingModels] = useState<any[]>([]);
  const [installingItems, setInstallingItems] = useState<Record<string, boolean>>({});
  const [importedData, setImportedData] = useState<any>(null);

  const handleExport = async () => {
    try {
      setError(null);
      setIsExporting(true);
      
      await exportSettings();
      setSuccess('Settings, custom nodes, and models exported successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setError('Please select a file to import.');
      return;
    }

    try {
      setError(null);
      setIsImporting(true);
      setMissingCustomNodes([]);
      setMissingModels([]);
      setImportedData(null);
      
      // Import the settings file
      const result = await importSettings(importFile);
      
      // Refresh settings after import
      await fetchSettings();
      
      // Check for missing items if this is a new format export
      if (result.isNewFormat) {
        setImportedData(result.data);
        const { missingCustomNodes, missingModels } = await checkMissingItems(result.data);
        setMissingCustomNodes(missingCustomNodes);
        setMissingModels(missingModels);
        
        if (missingCustomNodes.length > 0 || missingModels.length > 0) {
          setSuccess('Settings imported successfully! Some custom nodes or models are missing.');
        } else {
          setSuccess('Settings, custom nodes, and models imported successfully!');
        }
      } else {
        setSuccess('Settings imported successfully!');
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error importing data:', error);
      setError('Failed to import data. Please ensure the file is a valid JSON file.');
    } finally {
      setIsImporting(false);
      setImportFile(null);
    }
  };
  
  const handleInstallCustomNode = async (node: any) => {
    try {
      setInstallingItems(prev => ({ ...prev, [node.url]: true }));
      await installCustomNode(node);
      setMissingCustomNodes(prev => prev.filter(n => n.url !== node.url));
      setSuccess(`Custom node ${node.name || node.url} installed successfully!`);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error installing custom node:', error);
      setError(`Failed to install custom node: ${error.message}`);
    } finally {
      setInstallingItems(prev => ({ ...prev, [node.url]: false }));
    }
  };
  
  const handleInstallModel = async (model: any) => {
    try {
      setInstallingItems(prev => ({ ...prev, [model.path]: true }));
      
      // Create a download request for the model
      const downloadRequest = {
        source: 'url' as const,
        url: model.url || model.download_url,
        modelName: model.name,
        modelType: model.type || 'checkpoint',
        targetPath: model.path
      };
      
      await downloadModel(downloadRequest);
      setMissingModels(prev => prev.filter(m => m.path !== model.path));
      setSuccess(`Model ${model.name || model.path} download started!`);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error downloading model:', error);
      setError(`Failed to download model: ${error.message}`);
    } finally {
      setInstallingItems(prev => ({ ...prev, [model.path]: false }));
    }
  };
  
  const handleInstallAllMissing = async () => {
    try {
      setError(null);
      
      // Install all missing custom nodes
      for (const node of missingCustomNodes) {
        if (!installingItems[node.url]) {
          await handleInstallCustomNode(node);
        }
      }
      
      // Install all missing models
      for (const model of missingModels) {
        if (!installingItems[model.path]) {
          await handleInstallModel(model);
        }
      }
      
      setSuccess('Installation of all missing items has been initiated!');
    } catch (error: any) {
      console.error('Error installing all missing items:', error);
      setError(`Failed to install all missing items: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 flex items-center">
          <FiDownload className="mr-2" />
          Import/Export Settings, Custom Nodes & Models
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
          Backup or restore your complete ComfyUI setup including settings, custom nodes, and models.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
          <h4 className="text-lg font-medium mb-4 flex items-center">
            <FiDownload className="mr-2" />
            Export Everything
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download your current settings, custom nodes, and models as a JSON file.
          </p>
          <button
            type="button"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
            onClick={handleExport}
            disabled={isExporting || saving}
          >
            <FiDownload className="mr-2" />
            Export Everything
          </button>
        </div>
        
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
          <h4 className="text-lg font-medium mb-4 flex items-center">
            <FiUpload className="mr-2" />
            Import Everything
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload a JSON file to restore your settings, custom nodes, and models.
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Export File
            </label>
            <input
              type="file"
              accept=".json"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
          </div>
          <button
            type="button"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
            onClick={handleImport}
            disabled={!importFile || isImporting || saving}
          >
            <FiUpload className="mr-2" />
            Import Everything
          </button>
        </div>
      </div>
      
      {/* Missing Items Section */}
      {(missingCustomNodes.length > 0 || missingModels.length > 0) && (
        <div className="mt-8">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300 flex items-center">
              <FiAlertCircle className="mr-2" />
              Missing Items Detected
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              Some custom nodes or models from your import file are not installed.
            </p>
            
            {/* Install All Button */}
            <button
              type="button"
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 flex items-center justify-center"
              onClick={handleInstallAllMissing}
              disabled={Object.values(installingItems).some(v => v)}
            >
              <FiCheckCircle className="mr-2" />
              Install All Missing Items
            </button>
          </div>
          
          {/* Missing Custom Nodes */}
          {missingCustomNodes.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-4 flex items-center">
                <FiPackage className="mr-2" />
                Missing Custom Nodes ({missingCustomNodes.length})
              </h4>
              <div className="space-y-4">
                {missingCustomNodes.map((node, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md flex justify-between items-center">
                    <div>
                      <h5 className="font-medium">{node.name || 'Unknown Node'}</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{node.url}</p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
                      onClick={() => handleInstallCustomNode(node)}
                      disabled={installingItems[node.url]}
                    >
                      {installingItems[node.url] ? 'Installing...' : 'Install'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Missing Models */}
          {missingModels.length > 0 && (
            <div>
              <h4 className="text-lg font-medium mb-4 flex items-center">
                <FiImage className="mr-2" />
                Missing Models ({missingModels.length})
              </h4>
              <div className="space-y-4">
                {missingModels.map((model, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md flex justify-between items-center">
                    <div>
                      <h5 className="font-medium">{model.name || 'Unknown Model'}</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{model.path}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{model.type || 'checkpoint'}</p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
                      onClick={() => handleInstallModel(model)}
                      disabled={installingItems[model.path]}
                    >
                      {installingItems[model.path] ? 'Downloading...' : 'Download'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
