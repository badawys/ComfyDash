"use client";

import { useState, useEffect, useRef } from 'react';
import { PlayIcon, StopIcon, ArrowPathIcon, CloudArrowDownIcon } from '@heroicons/react/24/solid';
import { startComfyUI, stopComfyUI, getComfyUIStatus, getComfyUILogs, installComfyUI, getInstallStatus } from '@/services/comfyUIService';

export default function ComfyUIControl() {
  const [status, setStatus] = useState<'stopped' | 'running' | 'starting' | 'stopping' | 'not_configured' | 'not_installed' | 'installing'>('stopped');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [comfyUIPath, setComfyUIPath] = useState<string>('');
  const [installMethod, setInstallMethod] = useState<'git' | 'zip'>('git');
  const [installPath, setInstallPath] = useState<string>('');
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      // First check if ComfyUI is installed
      const installStatusData = await getInstallStatus();
      
      if (installStatusData.status === 'not_installed') {
        setStatus('not_installed');
        setError(installStatusData.message || 'ComfyUI is not installed');
        return;
      }
      
      // If installed, check the running status
      const statusData = await getComfyUIStatus();
      setStatus(statusData.status);
      
      if (statusData.status === 'not_configured') {
        setComfyUIPath(statusData.comfyui_path || 'Not set');
        setError(statusData.message || 'ComfyUI path not configured or does not exist');
      } else if (statusData.status === 'running') {
        fetchLogs();
      }
    } catch (err) {
      console.error('Failed to fetch ComfyUI status:', err);
      setError('Failed to fetch ComfyUI status');
    }
  };

  const fetchLogs = async () => {
    try {
      const logsData = await getComfyUILogs();
      setLogs(logsData.logs || []);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to fetch ComfyUI logs:', err);
    }
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status === 'running') {
      const logsInterval = setInterval(() => {
        fetchLogs();
      }, 2000);

      return () => clearInterval(logsInterval);
    }
  }, [status]);

  const handleStart = async () => {
    try {
      setStatus('starting');
      setError(null);
      await startComfyUI();
      setStatus('running');
      fetchLogs();
    } catch (err) {
      console.error('Failed to start ComfyUI:', err);
      setError('Failed to start ComfyUI');
      setStatus('stopped');
    }
  };

  const handleStop = async () => {
    try {
      setStatus('stopping');
      setError(null);
      await stopComfyUI();
      setStatus('stopped');
    } catch (err) {
      console.error('Failed to stop ComfyUI:', err);
      setError('Failed to stop ComfyUI');
      setStatus('running');
    }
  };

  const handleRestart = async () => {
    try {
      setStatus('stopping');
      setError(null);
      await stopComfyUI();
      setTimeout(async () => {
        setStatus('starting');
        await startComfyUI();
        setStatus('running');
        fetchLogs();
      }, 2000);
    } catch (err) {
      console.error('Failed to restart ComfyUI:', err);
      setError('Failed to restart ComfyUI');
      fetchStatus(); // Get the current status
    }
  };

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      setStatus('installing');
      setError(null);
      setLogs([...(logs || []), `Starting ComfyUI installation using ${installMethod}...`]);
      
      const result = await installComfyUI(installPath || undefined, installMethod);
      
      if (result.status === 'error') {
        setError(result.message || 'Failed to install ComfyUI');
        setStatus('not_installed');
      } else {
        // Installation started successfully in the background
        setLogs([...logs, `Installing ComfyUI to ${result.path}...`]);
        
        // Poll for status updates every 5 seconds
        const checkInstallStatus = setInterval(async () => {
          const statusData = await getInstallStatus();
          if (statusData.status === 'installed') {
            clearInterval(checkInstallStatus);
            setLogs([...logs, 'ComfyUI installed successfully!']);
            fetchStatus();
          } else if (statusData.status === 'error') {
            clearInterval(checkInstallStatus);
            setError(statusData.message || 'Installation failed');
            setStatus('not_installed');
          }
        }, 5000);
      }
    } catch (err) {
      console.error('Failed to install ComfyUI:', err);
      setError('Failed to install ComfyUI');
      setStatus('not_installed');
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="space-y-4">
      {status === 'not_installed' ? (
        <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">ComfyUI Not Installed!</strong>
          <p className="block sm:inline mt-1">
            ComfyUI is not installed or the path is not configured. Would you like to download and install it now?
          </p>
          
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-blue-800">Installation Method:</label>
              <div className="mt-1 flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="installMethod"
                    value="git"
                    checked={installMethod === 'git'}
                    onChange={() => setInstallMethod('git')}
                  />
                  <span className="ml-2">Git (Recommended)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="installMethod"
                    value="zip"
                    checked={installMethod === 'zip'}
                    onChange={() => setInstallMethod('zip')}
                  />
                  <span className="ml-2">Zip Download</span>
                </label>
              </div>
            </div>
            
            <div>
              <label htmlFor="installPath" className="block text-sm font-medium text-blue-800">
                Installation Path (Optional):
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="installPath"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-blue-300 rounded-md"
                  placeholder="Leave empty for default location"
                  value={installPath}
                  onChange={(e) => setInstallPath(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-blue-600">
                If left empty, ComfyUI will be installed in a default location.
              </p>
            </div>
            
            <div className="flex justify-start">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className={`flex items-center px-4 py-2 rounded-md ${isInstalling ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                <CloudArrowDownIcon className="w-5 h-5 mr-2" />
                {isInstalling ? 'Installing...' : 'Install ComfyUI'}
              </button>
            </div>
          </div>
        </div>
      ) : status === 'not_configured' ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">ComfyUI Not Configured!</strong>
          <p className="block sm:inline mt-1">
            Please configure the ComfyUI path in the settings. Current path: <code className="bg-yellow-200 px-1 py-0.5 rounded">{comfyUIPath}</code>
          </p>
          <p className="mt-2">
            <a href="/settings" className="underline font-medium hover:text-yellow-900">Go to Settings</a> to configure ComfyUI.
          </p>
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <button
            onClick={handleStart}
            disabled={status !== 'stopped'}
            className={`flex items-center px-4 py-2 rounded-md ${status === 'stopped' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            Start ComfyUI
          </button>
          
          <button
            onClick={handleStop}
            disabled={status !== 'running'}
            className={`flex items-center px-4 py-2 rounded-md ${status === 'running' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <StopIcon className="w-5 h-5 mr-2" />
            Stop ComfyUI
          </button>
          
          <button
            onClick={handleRestart}
            disabled={status !== 'running'}
            className={`flex items-center px-4 py-2 rounded-md ${status === 'running' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Restart ComfyUI
          </button>
          
          <div className="ml-4">
            <span className="text-sm font-medium">Status: </span>
            <span className={`text-sm font-semibold ${status === 'running' ? 'text-green-600' : status === 'stopped' ? 'text-red-600' : 'text-yellow-600'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>
      )}
      
      {error && status !== 'not_configured' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {status !== 'not_configured' && (
        <div className="bg-black text-green-400 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
          {logs && logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {log}
              </div>
            ))
          ) : (
            <div className="text-gray-500">
              {status === 'stopped' ? 'ComfyUI is not running.' : 'Starting ComfyUI...'}
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}
