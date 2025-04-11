"use client";

import { useState, useEffect } from 'react';
import { searchCivitAIModels } from '@/services/modelService';
import { getSettings } from '@/services/settingsService';

interface CivitAISearchProps {
  onDownload: (params: any) => void;
  isDownloading: boolean;
}

interface CivitAIModel {
  id: string | number;
  name: string;
  description: string;
  type: string;
  nsfw: boolean;
  image?: string; // Direct image URL in the new API format
  creator?: {
    username: string;
  };
  stats?: {
    downloadCount: number;
    rating: number;
  };
  // New API format fields
  versionId?: string | number;
  versionName?: string;
  downloadCount?: number;
  rating?: number;
  // Traditional format fields
  modelVersions?: {
    id: string | number;
    name: string;
    createdAt?: string;
    downloadUrl?: string;
    images?: { url: string; nsfw?: boolean }[];
  }[];
}

const MODEL_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'Checkpoint', label: 'Checkpoint' },
  { value: 'LORA', label: 'LoRA' },
  { value: 'LyCORIS', label: 'LyCORIS' },
  { value: 'TextualInversion', label: 'Embedding' },
  { value: 'Controlnet', label: 'ControlNet' },
  { value: 'VAE', label: 'VAE' },
  { value: 'Upscaler', label: 'Upscaler' },
];

export default function CivitAISearch({ onDownload, isDownloading }: CivitAISearchProps) {
  const [query, setQuery] = useState('');
  const [modelType, setModelType] = useState('');
  const [results, setResults] = useState<CivitAIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<CivitAIModel | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [customPaths, setCustomPaths] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const settings = await getSettings();
        setHasApiKey(!!settings.civitaiApiKey);
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
      
      const data = await searchCivitAIModels(query, modelType, newPage);
      
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

  const handleModelSelect = (model: CivitAIModel) => {
    setSelectedModel(model);
    
    // Handle both API response formats - either modelVersions array or direct versionId
    if (model.versionId) {
      // Direct version ID in the response (new API format)
      setSelectedVersionId(String(model.versionId));
    } else if (model.modelVersions && model.modelVersions.length > 0) {
      // Traditional format with modelVersions array
      setSelectedVersionId(model.modelVersions[0]?.id ? String(model.modelVersions[0].id) : null);
    } else {
      setSelectedVersionId(null);
    }
    
    setCustomName(model.name);
  };

  const handleDownload = () => {
    if (!selectedModel || !selectedVersionId) return;
    
    // Handle both API response formats
    let modelType = selectedModel.type || 'Unknown';
    let modelName = customName || selectedModel.name;
    
    // Direct version ID format (new API format)
    if (selectedModel.versionId) {
      onDownload({
        source: 'civitai',
        modelId: selectedModel.id,
        versionId: selectedVersionId,
        modelName: modelName,
        modelType: modelType,
        targetPath: customPath || undefined,
      });
      return;
    }
    
    // Traditional format with modelVersions array
    if (!selectedModel.modelVersions || selectedModel.modelVersions.length === 0) {
      console.error('No model versions available');
      return;
    }
    
    const selectedVersion = selectedModel.modelVersions.find(v => String(v.id) === selectedVersionId);
    if (!selectedVersion) {
      console.error('Selected version not found');
      return;
    }
    
    onDownload({
      source: 'civitai',
      modelId: selectedModel.id,
      versionId: selectedVersionId,
      modelName: modelName,
      modelType: modelType,
      targetPath: customPath || undefined,
    });
    
    // Reset selection
    setSelectedModel(null);
    setSelectedVersionId(null);
    setCustomName('');
    setCustomPath('');
  };

  if (!hasApiKey) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300 rounded-md">
        <p>CivitAI API key is not configured. Please add your API key in the Settings page.</p>
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
              {/* Handle both direct image URL and modelVersions array formats */}
              {selectedModel.image ? (
                <img
                  src={selectedModel.image}
                  alt={selectedModel.name}
                  className="w-full h-auto rounded-md mb-4"
                  onError={(e) => {
                    // Handle image load error by setting a fallback
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                  }}
                />
              ) : selectedModel.modelVersions && selectedModel.modelVersions.length > 0 && selectedVersionId ? (
                selectedModel.modelVersions.find(v => String(v.id) === selectedVersionId)?.images?.[0]?.url ? (
                  <img
                    src={selectedModel.modelVersions.find(v => String(v.id) === selectedVersionId)?.images?.[0].url}
                    alt={selectedModel.name}
                    className="w-full h-auto rounded-md mb-4"
                    onError={(e) => {
                      // Handle image load error by setting a fallback
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                    }}
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-md mb-4 flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500">No image available</span>
                  </div>
                )
              ) : (
                <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-md mb-4 flex items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-500">No image available</span>
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Created by: {selectedModel.creator?.username || 'Unknown'}</p>
                <p className="text-sm">{selectedModel.description || 'No description available'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="version" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Version
                </label>
                <select
                  id="version"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  value={selectedVersionId || ''}
                  onChange={(e) => setSelectedVersionId(e.target.value)}
                >
                  {/* Handle both API response formats */}
                  {selectedModel.versionId && selectedModel.versionName ? (
                    // New API format with direct version info
                    <option key={selectedModel.versionId} value={String(selectedModel.versionId)}>
                      {selectedModel.versionName || `Version ${selectedModel.versionId}`}
                    </option>
                  ) : selectedModel.modelVersions && selectedModel.modelVersions.length > 0 ? (
                    // Traditional format with modelVersions array
                    selectedModel.modelVersions.map((version) => (
                      <option key={version.id} value={String(version.id)}>
                        {version.name || `Version ${version.id}`}
                      </option>
                    ))
                  ) : (
                    <option value="">No versions available</option>
                  )}
                </select>
              </div>
              
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
                disabled={isDownloading || !selectedVersionId}
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
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleModelSelect(model)}
                >
                  {model.modelVersions && model.modelVersions.length > 0 && model.modelVersions[0]?.images && model.modelVersions[0].images.length > 0 && model.modelVersions[0].images[0]?.url ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={model.modelVersions[0].images[0].url}
                        alt={model.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Handle image load error by setting a fallback
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <span className="text-gray-400 dark:text-gray-500">No image available</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">{model.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Type: {model.type}</p>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Downloads: {model.stats?.downloadCount ? model.stats.downloadCount.toLocaleString() : 'N/A'}</span>
                      <span>Rating: {model.stats?.rating ? model.stats.rating.toFixed(1) + '/5' : 'N/A'}</span>
                    </div>
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
