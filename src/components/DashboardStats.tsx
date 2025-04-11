"use client";

import { useState, useEffect } from 'react';
import { ServerIcon, CpuChipIcon, CircleStackIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { monitoringService } from '@/services/monitoringService';
import { serverService } from '@/services/serverService';
import { fetchStorageInfo } from '@/services/systemService';

type SystemStats = {
  gpu_usage: number;
  vram_usage: number;
  cpu_usage: number;
  ram_usage: number;
  storage_usage: number;
  gpu_name: string;
};

type ServerStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'unknown';

export default function DashboardStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('unknown');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(1000); // Default to 1 second
  const [storageInfo, setStorageInfo] = useState<any>(null);

  useEffect(() => {
    const getStats = async () => {
      try {
        // Use the current refreshInterval state value
        const data = await monitoringService.getSystemStats(refreshInterval);
        
        // Get storage info
        const storage = await fetchStorageInfo();
        setStorageInfo(storage);
        
        // Transform the data to match what the component expects
        const transformedData = {
          gpu_usage: data?.gpu?.usage || 0,
          vram_usage: data?.gpu?.memory_percent_used || 0,
          cpu_usage: data?.cpu?.usage || 0,
          ram_usage: data?.ram?.percent || 0, // Fix: Use ram.percent instead of memory.percent_used
          storage_usage: storage?.disk_space?.percent || 0,
          gpu_name: data?.gpu?.name || 'GPU'
        };
        setStats(transformedData);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
        setError('Failed to connect to the backend server. Please make sure it\'s running.');
      } finally {
        setLoading(false);
      }
    };
    
    const checkServerStatus = async () => {
      try {
        const status = await serverService.getStatus();
        if (['running', 'stopped', 'starting', 'stopping'].includes(status)) {
          setServerStatus(status as ServerStatus);
        } else {
          setServerStatus('unknown');
        }
      } catch (error) {
        console.error('Failed to fetch server status:', error);
        setServerStatus('unknown');
      }
    };

    // We'll skip trying to fetch from the API if it's not available
    // Default refresh interval is defined inside fetchRefreshInterval
    
    const fetchRefreshInterval = async () => {
      // Use a default refresh interval of 1000ms (1 second)
      const DEFAULT_REFRESH_INTERVAL = 1000;
      
      try {
        // Use the settings API to get the refresh interval
        const response = await fetch('/api/settings');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const settingsData = await response.json();
        const interval = settingsData.refreshInterval || DEFAULT_REFRESH_INTERVAL;
        
        // Update the refresh interval state
        setRefreshInterval(interval);
        return interval;
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        return DEFAULT_REFRESH_INTERVAL; // Use default if settings can't be fetched
      }
    };

    let intervalId: NodeJS.Timeout;
    
    // Initialize stats and set up interval
    const initStats = async () => {
      try {
        await getStats(); // Get initial stats
        await checkServerStatus(); // Check server status
      } catch (err) {
        console.error('Failed to get initial stats:', err);
        // Continue even if initial stats fetch fails
      }
      
      // Start with a default value that will be immediately replaced
      let refreshInterval = 1000; // 1 second default
      
      try {
        refreshInterval = await fetchRefreshInterval();
      } catch (err) {
        console.warn('Using default refresh interval due to error:', err);
      }
      
      console.log(`Setting refresh interval to ${refreshInterval}ms`);
      
      // Clear any existing interval
      if (intervalId) clearInterval(intervalId);
      
      // Set new interval for stats
      intervalId = setInterval(async () => {
        await getStats();
        // Only check server status every 10 seconds to reduce API calls
        if (Date.now() % 10000 < refreshInterval) {
          await checkServerStatus();
        }
      }, refreshInterval);
    };

    initStats();

    // Clean up interval on component unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const getServerStatusColor = () => {
    switch (serverStatus) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-red-100 text-red-800';
      case 'starting':
        return 'bg-yellow-100 text-yellow-800';
      case 'stopping':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServerStatusText = () => {
    switch (serverStatus) {
      case 'running':
        return 'Online';
      case 'stopped':
        return 'Offline';
      case 'starting':
        return 'Starting...';
      case 'stopping':
        return 'Stopping...';
      default:
        return 'Unknown';
    }
  };

  const statCards = [
    {
      title: 'API Server Status',
      value: getServerStatusText(),
      icon: ServerIcon,
      color: getServerStatusColor(),
      description: 'ComfyUI Server',
    },
    {
      title: 'GPU Usage',
      value: stats ? `${stats.gpu_usage}%` : '-',
      icon: ServerIcon,
      color: 'bg-blue-100 text-blue-800',
      description: stats?.gpu_name || 'GPU',
    },
    {
      title: 'VRAM Usage',
      value: stats ? `${stats.vram_usage}%` : '-',
      icon: CpuChipIcon,
      color: 'bg-purple-100 text-purple-800',
      description: 'Video Memory',
    },
    {
      title: 'CPU Usage',
      value: stats ? `${stats.cpu_usage}%` : '-',
      icon: CpuChipIcon,
      color: 'bg-green-100 text-green-800',
      description: 'Processor',
    },
    {
      title: 'RAM Usage',
      value: stats ? `${stats.ram_usage}%` : '-',
      icon: CircleStackIcon,
      color: 'bg-amber-100 text-amber-800',
      description: 'System Memory',
    },
    {
      title: 'Storage Usage',
      value: stats ? `${stats.storage_usage}%` : '-',
      icon: ArchiveBoxIcon,
      color: 'bg-indigo-100 text-indigo-800',
      description: 'Disk Space',
    },
  ];

  if (loading) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        ))}
      </>
    );
  }

  if (error) {
    return (
      <div className="col-span-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Connection Error!</strong>
        <p className="block sm:inline mt-1">{error}</p>
        <p className="mt-2">
          Please make sure the backend server is running on port 8618 and is accessible.
        </p>
      </div>
    );
  }

  return (
    <>
      {statCards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow flex flex-col justify-around h-full"
        >
          <div className="flex items-center">
            <div className={`p-1.5 rounded-full ${card.color}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <h3 className="ml-2 text-xs font-medium text-gray-500 dark:text-gray-400">{card.title}</h3>
          </div>
          <p className="text-lg font-semibold text-center">{card.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{card.description}</p>
        </div>
      ))}
    </>
  );
}
