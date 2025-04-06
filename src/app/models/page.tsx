import { Suspense } from 'react';
import ModelDownloader from '@/components/ModelDownloader';
import ActiveDownloads from '@/components/ActiveDownloads';
import InstalledModels from '@/components/InstalledModels';

export default function ModelsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Model Management</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Installed Models</h2>
        <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>}>
          <InstalledModels />
        </Suspense>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Download Models</h2>
        <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>}>
          <ModelDownloader />
        </Suspense>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Active Downloads</h2>
        <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>}>
          <ActiveDownloads />
        </Suspense>
      </div>
    </div>
  );
}
