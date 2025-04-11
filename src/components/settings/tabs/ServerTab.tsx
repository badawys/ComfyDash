import React from 'react';
import { FiServer, FiRefreshCw, FiInfo } from 'react-icons/fi';
import { useSettings } from '@/contexts/SettingsContext';
import { serverService } from '@/services/serverService';

export const ServerTab: React.FC = () => {
  const { 
    settings, 
    setSettings, 
    serverStatus, 
    serverActionInProgress, 
    setServerActionInProgress,
    setError,
    setSuccess,
    checkServerStatus
  } = useSettings();

  const handleRestartServer = async () => {
    try {
      setServerActionInProgress(true);
      setError(null);
      
      // Use the serverService to restart the server
      await serverService.restart();
      
      // Check the status after a short delay
      setTimeout(async () => {
        await checkServerStatus();
        setServerActionInProgress(false);
        setSuccess('Server restarted successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }, 2000);
    } catch (error: any) {
      console.error('Error restarting server:', error);
      setError('Failed to restart server. Please try again.');
      setServerActionInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 flex items-center">
          <FiServer className="mr-2" />
          Server Configuration
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
          Configure server settings and manage server status.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Server Status</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${serverStatus === 'running' ? 'bg-green-500' : serverStatus === 'stopped' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
              <span className="font-medium">
                {serverStatus === 'running' ? 'Online' : 
                 serverStatus === 'stopped' ? 'Offline' : 
                 serverStatus === 'starting' ? 'Starting...' : 
                 serverStatus === 'stopping' ? 'Stopping...' : 'Unknown'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <button
              type="button"
              onClick={handleRestartServer}
              disabled={serverActionInProgress}
              className={`px-4 py-2 rounded-md flex items-center ${serverActionInProgress ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <FiRefreshCw className={`mr-2 ${serverActionInProgress ? 'animate-spin' : ''}`} />
              {serverActionInProgress ? 'Processing...' : 'Restart Server'}
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-medium mb-4">Server Settings</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="serverPort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Server Port
              </label>
              <input
                type="number"
                id="serverPort"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="8618"
                value={settings.serverPort || 8618}
                onChange={(e) => setSettings({ ...settings, serverPort: parseInt(e.target.value) })}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                The port number for the ComfyUI backend server
              </p>
            </div>
            
            <div>
              <label htmlFor="apiPort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Port
              </label>
              <input
                type="number"
                id="apiPort"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="8618"
                value={settings.apiPort || 8618}
                onChange={(e) => setSettings({ ...settings, apiPort: parseInt(e.target.value) })}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                The port number for the backend API server (default: 8618)
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="allowCors" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Allow CORS
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enable Cross-Origin Resource Sharing for API requests.
                </p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="allowCors"
                    className="sr-only peer"
                    checked={settings.allowCors || false}
                    onChange={(e) => setSettings({ ...settings, allowCors: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="debug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Debug Mode
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enable debug mode for additional logging.
                </p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="debug"
                    className="sr-only peer"
                    checked={settings.debug || false}
                    onChange={(e) => setSettings({ ...settings, debug: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md mt-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center">
              <FiInfo className="mr-2 flex-shrink-0" />
              Changes to server settings require restarting the server to take effect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
