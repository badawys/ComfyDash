import { Suspense } from 'react';
import SettingsManager from '@/components/SettingsManager';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>}>
          <SettingsManager />
        </Suspense>
      </div>
    </div>
  );
}
