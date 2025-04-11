import { Suspense } from 'react';
import DashboardStats from '@/components/DashboardStats';
import SystemInfo from '@/components/SystemInfo';
import ComfyUIControl from '@/components/ComfyUIControl';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Suspense fallback={<div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>}>
            <DashboardStats />
          </Suspense>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">System Information</h2>
          <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>}>
            <SystemInfo />
          </Suspense>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">ComfyUI Control</h2>
        <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>}>
          <ComfyUIControl />
        </Suspense>
      </div>
    </div>
  );
}
