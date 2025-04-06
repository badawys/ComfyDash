"use client";

import { useState, useEffect } from 'react';
import { searchHuggingFaceModels } from '@/services/modelService';
import { getSettings } from '@/services/settingsService';

interface HuggingFaceSearchProps {
  onDownload: (params: any) => void;
  isDownloading: boolean;
}

interface HuggingFaceModel {
  id: string;
  modelId: string;
  name: string;
  description: string;
  tags: string[];
  downloads: number;
  likes: number;
  lastModified: string;
  author: string;
}

const MODEL_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'diffusers', label: 'Diffusers' },
  { value: 'safetensors', label: 'Safetensors' },
  { value: 'ckpt', label: 'Checkpoint' },
  { value: 'lora', label: 'LoRA' },
  { value: 'controlnet', label: 'ControlNet' },
  { value: 'embedding', label: 'Embedding' },
  { value: 'vae', label: 'VAE' },
];

export default function HuggingFaceSearch({ onDownload, isDownloading }: HuggingFaceSearchProps) {
  const [query, setQuery] = useState('');
  const [modelType, setModelType] = useState('');
  const [results, setResults] = useState<HuggingFaceModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<HuggingFaceModel | null>(null);
  const [customName, setCustomName] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [customPaths, setCustomPaths] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const settings = await getSettings();
        setHasApiKey(!!settings.huggingfaceApiKey);
        setCustomPaths(settings.customPaths || {});
      } catch (error) {
        console.error('Failed to check API key:', error);
      }
    };

    checkApiKey();
  }, []);

  const handleSearch = async (resetPage = true) => {
    if (!query.trim() && !modelType) return;

    try {
      setLoading(true);
      setError(null);
      const newPage = resetPage ? 1 : page;
      
      const data = await searchHuggingFaceModels(query, modelType, newPage);
      
      if (resetPage) {
        setResults(data.items);
      } else {
        setResults([...results, ...data.items]);
      }
      
      setHasMore(data.items.length === 10); // Assuming 10 items per page
      if (resetPage) setPage(1);
      else setPage(newPage + 1);
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to search models');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      handleSearch(false);
    }
  };

  const handleModelSelect = (model: HuggingFaceModel) => {
    setSelectedModel(model);
    setCustomName(model.name);
  };

  const handleDownload = () => {
    if (!selectedModel) return;
    
    onDownload({
      source: 'huggingface',
      modelId: selectedModel.modelId,
      modelName: customName || selectedModel.name,
      modelType: selectedModel.tags[0] || 'model',
      targetPath: customPath || undefined,
    });
    
    // Reset selection
    setSelectedModel(null);
    setCustomName('');
    setCustomPath('');
  };

  if (!hasApiKey) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300 rounded-md">
        <p>HuggingFace API key is not configured. Please add your API key in the Settings page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Models
          </label>
          <input
            type="text"
            id="search"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Search for models..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <div className="w-full md:w-64">
          <label htmlFor="modelType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Model Type
          </label>
          <select
            id="modelType"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
          >
            {MODEL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="self-end">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            onClick={() => handleSearch()}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}
      
      {selectedModel ? (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">{selectedModel.name}</h3>
            <button
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setSelectedModel(null)}
            >
              Back to results
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Author: {selectedModel.author}</p>
                <p className="text-sm mb-2">{selectedModel.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedModel.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="customName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Name (Optional)
                </label>
                <input
                  type="text"
                  id="customName"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Custom file name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="customPath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Path (Optional)
                </label>
                <select
                  id="customPath"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                >
                  <option value="">Default Path</option>
                  {Object.entries(customPaths).map(([key, path]) => (
                    <option key={key} value={path}>
                      {key}: {path}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? 'Starting Download...' : 'Download Model'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((model) => (
                <div
                  key={model.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow p-4"
                  onClick={() => handleModelSelect(model)}
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">{model.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{model.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {model.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {model.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs rounded-full">
                        +{model.tags.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Downloads: {model.downloads.toLocaleString()}</span>
                    <span>Likes: {model.likes.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {loading ? 'Searching...' : 'No results found. Try a different search term.'}
            </div>
          )}
          
          {hasMore && results.length > 0 && (
            <div className="mt-6 text-center">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
