"use client";

import { useState, useEffect } from 'react';
import { getDownloadStatus } from '@/services/modelService';

interface DownloadStatus {
  id: string;
  modelName: string;
  progress: number;
  status: 'queued' | 'downloading' | 'completed' | 'failed';
  speed: string;
  eta: string;
  error?: string;
}

export default function ActiveDownloads() {
  const [downloads, setDownloads] = useState<DownloadStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, we would fetch the list of active downloads
    // For now, we'll use localStorage to track downloads initiated in this session
    const fetchActiveDownloads = () => {
      try {
        const storedDownloads = localStorage.getItem('activeDownloads');
        if (storedDownloads) {
          const parsedDownloads = JSON.parse(storedDownloads);
          setDownloads(parsedDownloads);
          
          // Update status for each download
          parsedDownloads.forEach((download: DownloadStatus) => {
            if (download.status !== 'completed' && download.status !== 'failed') {
              updateDownloadStatus(download.id);
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch active downloads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveDownloads();
    const interval = setInterval(fetchActiveDownloads, 5000);

    return () => clearInterval(interval);
  }, []);

  // Listen for new download events
  useEffect(() => {
    const handleNewDownload = (event: CustomEvent) => {
      const downloadInfo = event.detail;
      setDownloads(prev => {
        const newDownloads = [...prev];
        const existingIndex = newDownloads.findIndex(d => d.id === downloadInfo.id);
        
        if (existingIndex >= 0) {
          newDownloads[existingIndex] = downloadInfo;
        } else {
          newDownloads.push(downloadInfo);
        }
        
        localStorage.setItem('activeDownloads', JSON.stringify(newDownloads));
        return newDownloads;
      });
      
      // Start tracking the new download
      if (downloadInfo.status !== 'completed' && downloadInfo.status !== 'failed') {
        updateDownloadStatus(downloadInfo.id);
      }
    };

    window.addEventListener('new-download', handleNewDownload as EventListener);
    return () => window.removeEventListener('new-download', handleNewDownload as EventListener);
  }, []);

  const updateDownloadStatus = async (downloadId: string) => {
    try {
      const status = await getDownloadStatus(downloadId);
      
      setDownloads(prev => {
        const newDownloads = [...prev];
        const downloadIndex = newDownloads.findIndex(d => d.id === downloadId);
        
        if (downloadIndex >= 0) {
          newDownloads[downloadIndex] = {
            ...newDownloads[downloadIndex],
            ...status,
          };
        }
        
        localStorage.setItem('activeDownloads', JSON.stringify(newDownloads));
        return newDownloads;
      });
      
      // Continue polling if download is still in progress
      if (status.status !== 'completed' && status.status !== 'failed') {
        setTimeout(() => updateDownloadStatus(downloadId), 2000);
      }
    } catch (error) {
      console.error(`Failed to update status for download ${downloadId}:`, error);
    }
  };

  const clearCompleted = () => {
    setDownloads(prev => {
      const activeDownloads = prev.filter(d => 
        d.status !== 'completed' && d.status !== 'failed'
      );
      localStorage.setItem('activeDownloads', JSON.stringify(activeDownloads));
      return activeDownloads;
    });
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading downloads...</div>;
  }

  if (downloads.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No active downloads. Start a download from the options above.
      </div>
    );
  }

  const hasCompleted = downloads.some(d => d.status === 'completed' || d.status === 'failed');

  return (
    <div className="space-y-4">
      {hasCompleted && (
        <div className="flex justify-end">
          <button
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={clearCompleted}
          >
            Clear Completed
          </button>
        </div>
      )}
      
      <div className="space-y-4">
        {downloads.map((download) => (
          <div 
            key={download.id} 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{download.modelName}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                download.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                download.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                download.status === 'downloading' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              }`}>
                {download.status.charAt(0).toUpperCase() + download.status.slice(1)}
              </span>
            </div>
            
            {download.status === 'downloading' && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${download.progress}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{download.progress.toFixed(1)}%</span>
                  <span>Speed: {download.speed}</span>
                  <span>ETA: {download.eta}</span>
                </div>
              </div>
            )}
            
            {download.status === 'failed' && download.error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Error: {download.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
