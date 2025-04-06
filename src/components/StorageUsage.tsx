"use client";

import { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { fetchStorageInfo } from '@/services/systemService';

ChartJS.register(ArcElement, Tooltip, Legend);

type StorageInfo = {
  total: number;
  used: number;
  free: number;
  models_size: number;
  custom_nodes_size: number;
  other_size: number;
};

export default function StorageUsage() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getStorageInfo = async () => {
      try {
        const data = await fetchStorageInfo();
        setStorageInfo(data);
      } catch (error) {
        console.error('Failed to fetch storage info:', error);
      } finally {
        setLoading(false);
      }
    };

    getStorageInfo();
    const interval = setInterval(getStorageInfo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (loading || !storageInfo) {
    return <div className="h-64 flex items-center justify-center">Loading storage information...</div>;
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usedPercentage = ((storageInfo.used / storageInfo.total) * 100).toFixed(1);
  const freePercentage = ((storageInfo.free / storageInfo.total) * 100).toFixed(1);

  const data = {
    labels: ['Models', 'Custom Nodes', 'Other', 'Free Space'],
    datasets: [
      {
        data: [
          storageInfo.models_size,
          storageInfo.custom_nodes_size,
          storageInfo.other_size,
          storageInfo.free
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = ((value / storageInfo.total) * 100).toFixed(1);
            return `${label}: ${formatSize(value)} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="h-full">
      <div className="flex justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Space</p>
          <p className="text-lg font-medium">{formatSize(storageInfo.total)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Used Space</p>
          <p className="text-lg font-medium">{formatSize(storageInfo.used)} ({usedPercentage}%)</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Free Space</p>
          <p className="text-lg font-medium">{formatSize(storageInfo.free)} ({freePercentage}%)</p>
        </div>
      </div>
      
      <div className="h-64">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}
