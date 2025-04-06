"use client";

import { useState, useEffect } from 'react';
import { ServerIcon, CpuChipIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import { fetchSystemStats } from '@/services/systemService';

type SystemStats = {
  gpu_usage: number;
  vram_usage: number;
  cpu_usage: number;
  ram_usage: number;
  gpu_name: string;
};

export default function DashboardStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getStats = async () => {
      try {
        const data = await fetchSystemStats();
        setStats(data);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
        setError('Failed to connect to the backend server. Please make sure it\'s running.');
      } finally {
        setLoading(false);
      }
    };

    // We'll skip trying to fetch from the API if it's not available
    // Default refresh interval is defined inside fetchRefreshInterval
    
    const fetchRefreshInterval = async () => {
      // Use a default refresh interval of 1000ms (1 second)
      const DEFAULT_REFRESH_INTERVAL = 1000;
      
      try {
        // Try to fetch settings, but with a short timeout to fail fast if API is unavailable
        const controller = new AbortController();
        let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
          controller.abort('Timeout exceeded');
          timeoutId = null;
        }, 1000);
        
        try {
          const response = await fetch('/api/settings', { 
            signal: controller.signal 
          });
          
          // Clear timeout if fetch completed successfully
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const settingsData = await response.json();
          return settingsData.refreshInterval || DEFAULT_REFRESH_INTERVAL;
        } catch (error) {
          // Clear timeout if it hasn't fired yet
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          throw error; // Re-throw to be caught by outer catch
        }
      } catch (error) {
        // Don't log AbortError as it's expected when timeout occurs
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Failed to fetch settings:', error);
        }
        return DEFAULT_REFRESH_INTERVAL; // Use default if settings can't be fetched
      }
    };

    let intervalId: NodeJS.Timeout;
    
    // Initialize stats and set up interval
    const initStats = async () => {
      try {
        await getStats(); // Get initial stats
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
      
      // Set new interval
      intervalId = setInterval(getStats, refreshInterval);
    };

    initStats();

    // Clean up interval on component unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const statCards = [
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
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col"
        >
          <div className="flex items-center mb-2">
            <div className={`p-2 rounded-full ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <h3 className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</h3>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-semibold">{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{card.description}</p>
          </div>
        </div>
      ))}
    </>
  );
}
