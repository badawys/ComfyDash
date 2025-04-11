"use client";

import { useState, useEffect } from 'react';
import { TrashIcon, ArrowDownTrayIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { getModelsList } from '@/services/modelService';

interface Model {
  id: string;
  name: string;
  type: string;
  path: string;
  size: number;
  created: string;
  hash?: string;
  isDeleting?: boolean;
}

export default function InstalledModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getModelsList();
      // Ensure data.models exists before setting state
      setModels(data?.models || []);
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to fetch models');
      // Set models to empty array on error
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (model: Model) => {
    if (!confirm(`Are you sure you want to delete ${model.name}?`)) {
      return;
    }
    
    try {
      // Update local state to show deleting status
      setModels(prev => prev.map(m => 
        m.id === model.id ? { ...m, isDeleting: true } : m
      ));
      
      // In a real implementation, we would call an API to delete the model
      // await deleteModel(model.id);
      
      // For now, just simulate deletion after a delay
      setTimeout(() => {
        setModels(prev => prev.filter(m => m.id !== model.id));
      }, 1000);
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || `Failed to delete ${model.name}`);
      
      // Reset deleting status on error
      setModels(prev => prev.map(m => 
        m.id === model.id ? { ...m, isDeleting: false } : m
      ));
    }
  };

  const handleOpenFolder = (path: string) => {
    // In a real implementation, we would call an API to open the folder
    // For now, just log the path
    console.log(`Opening folder: ${path}`);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Ensure models is an array before filtering
  const filteredModels = models ? models.filter(model => {
    // Apply type filter
    if (filter !== 'all' && model.type !== filter) return false;
    
    // Apply search filter
    if (searchTerm && !model.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  }) : [];

  // Ensure models is an array before mapping
  const modelTypes = ['all', ...Array.from(new Set(models ? models.map(model => model.type) : []))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1">
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Models
          </label>
          <input
            type="text"
            id="searchTerm"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-64">
          <label htmlFor="filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filter by Type
          </label>
          <select
            id="filter"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {modelTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="self-end">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={fetchModels}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading models...</div>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No models found. {searchTerm || filter !== 'all' ? 'Try adjusting your filters.' : ''}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Added
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredModels.map((model) => (
                <tr key={model.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {model.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {model.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatSize(model.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(model.created).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenFolder(model.path)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Open Folder"
                      >
                        <FolderOpenIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(model)}
                        disabled={model.isDeleting}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
