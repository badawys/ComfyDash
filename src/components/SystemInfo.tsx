"use client";

import { useState, useEffect } from 'react';
import { fetchSystemInfo } from '@/services/systemService';

type SystemInfo = {
  gpu_name: string;
  gpu_driver: string;
  cpu_info: string;
  total_ram: string;
  os_info: string;
  python_version: string;
};

export default function SystemInfo() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSystemInfo = async () => {
      try {
        const data = await fetchSystemInfo();
        setSystemInfo(data);
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      } finally {
        setLoading(false);
      }
    };

    getSystemInfo();
  }, []);

  if (loading || !systemInfo) {
    return <div className="h-64 flex items-center justify-center">Loading system information...</div>;
  }

  const infoItems = [
    { label: 'GPU', value: systemInfo.gpu_name },
    { label: 'GPU Driver', value: systemInfo.gpu_driver },
    { label: 'CPU', value: systemInfo.cpu_info },
    { label: 'Total RAM', value: systemInfo.total_ram },
    { label: 'Operating System', value: systemInfo.os_info },
    { label: 'Python Version', value: systemInfo.python_version },
  ];

  return (
    <div className="space-y-4">
      {infoItems.map((item, index) => (
        <div key={index} className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">{item.label}:</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
