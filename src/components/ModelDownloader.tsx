"use client";

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { downloadModel, ModelSource } from '@/services/modelService';
import CivitAISearch from './model-downloaders/CivitAISearch';
import HuggingFaceSearch from './model-downloaders/HuggingFaceSearch';
import DirectUrlDownload from './model-downloaders/DirectUrlDownload';

const tabs = [
  { name: 'CivitAI', component: CivitAISearch },
  { name: 'HuggingFace', component: HuggingFaceSearch },
  { name: 'Direct URL', component: DirectUrlDownload },
];

export default function ModelDownloader() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<{ success?: boolean; message?: string; downloadId?: string }>({});

  const handleDownload = async (params: {
    source: ModelSource;
    modelId?: string;
    url?: string;
    modelName: string;
    modelType: string;
    targetPath?: string;
  }) => {
    try {
      setIsDownloading(true);
      setDownloadStatus({});
      
      const result = await downloadModel({
        source: params.source,
        modelId: params.modelId,
        url: params.url,
        modelName: params.modelName,
        modelType: params.modelType,
        targetPath: params.targetPath,
      });
      
      setDownloadStatus({
        success: true,
        message: `Download started: ${params.modelName}`,
        downloadId: result.downloadId,
      });
    } catch (error: any) {
      setDownloadStatus({
        success: false,
        message: `Error: ${error.response?.data?.message || error.message || 'Unknown error'}`,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                ${selected
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-blue-600'}`
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-4">
          {tabs.map((tab, idx) => (
            <Tab.Panel key={idx} className={`rounded-xl p-3`}>
              <tab.component onDownload={handleDownload} isDownloading={isDownloading} />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>

      {downloadStatus.message && (
        <div
          className={`mt-4 p-4 rounded-md ${downloadStatus.success ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300'}`}
        >
          {downloadStatus.message}
        </div>
      )}
    </div>
  );
}
