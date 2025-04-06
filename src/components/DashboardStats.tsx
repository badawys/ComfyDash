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

  useEffect(() => {
    const getStats = async () => {
      try {
        const data = await fetchSystemStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      } finally {
        setLoading(false);
      }
    };

    // Get refresh interval from settings or use default (1000ms)
    const fetchRefreshInterval = async () => {
      try {
        const settings = await fetch('/api/settings');
        const settingsData = await settings.json();
        return settingsData.refreshInterval || 1000;
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        return 1000; // Default to 1 second if settings can't be fetched
      }
    };

    let intervalId: NodeJS.Timeout;
    
    // Initialize stats and set up interval
    const initStats = async () => {
      await getStats(); // Get initial stats
      
      const refreshInterval = await fetchRefreshInterval();
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
