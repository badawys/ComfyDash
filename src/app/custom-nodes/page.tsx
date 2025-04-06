import { Suspense } from 'react';
import CustomNodesManager from '@/components/CustomNodesManager';
import RequirementsManager from '@/components/RequirementsManager';

export default function CustomNodesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Custom Nodes Manager</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Manage Custom Nodes</h2>
        <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>}>
          <CustomNodesManager />
        </Suspense>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Requirements Manager</h2>
        <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>}>
          <RequirementsManager />
        </Suspense>
      </div>
    </div>
  );
}
