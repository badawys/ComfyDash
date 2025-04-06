"use client";

import { useState, useEffect } from 'react';
import { getSettings } from '@/services/settingsService';

interface DirectUrlDownloadProps {
  onDownload: (params: any) => void;
  isDownloading: boolean;
}

const MODEL_TYPES = [
  { value: 'checkpoint', label: 'Checkpoint' },
  { value: 'lora', label: 'LoRA' },
  { value: 'lycoris', label: 'LyCORIS' },
  { value: 'embedding', label: 'Embedding' },
  { value: 'controlnet', label: 'ControlNet' },
  { value: 'vae', label: 'VAE' },
  { value: 'upscaler', label: 'Upscaler' },
  { value: 'other', label: 'Other' },
];

export default function DirectUrlDownload({ onDownload, isDownloading }: DirectUrlDownloadProps) {
  const [url, setUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelType, setModelType] = useState('checkpoint');
  const [customPath, setCustomPath] = useState('');
  const [customPaths, setCustomPaths] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        setCustomPaths(settings.customPaths || {});
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('URL is required');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(url);
    } catch (err) {
      setError('Invalid URL format');
      return;
    }
    
    setError(null);
    
    onDownload({
      source: 'url',
      url,
      modelName: modelName || extractFilenameFromUrl(url),
      modelType,
      targetPath: customPath || undefined,
    });
    
    // Reset form
    setUrl('');
    setModelName('');
    setModelType('checkpoint');
    setCustomPath('');
  };

  const extractFilenameFromUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const filename = pathname.split('/').pop() || 'downloaded_model';
      
      // Remove query parameters if present
      return filename.split('?')[0];
    } catch (err) {
      return 'downloaded_model';
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Auto-populate model name from URL if not manually set
    if (!modelName && newUrl) {
      setModelName(extractFilenameFromUrl(newUrl));
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Model URL
          </label>
          <input
            type="text"
            id="url"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="https://example.com/model.safetensors"
            value={url}
            onChange={handleUrlChange}
            required
          />
        </div>
        
        <div>
          <label htmlFor="modelName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Model Name (Optional)
          </label>
          <input
            type="text"
            id="modelName"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Custom file name"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            If left empty, the filename will be extracted from the URL
          </p>
        </div>
        
        <div>
          <label htmlFor="modelType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Model Type
          </label>
          <select
            id="modelType"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            required
          >
            {MODEL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
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
        
        {error && (
          <div className="p-4 bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300 rounded-md">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isDownloading}
        >
          {isDownloading ? 'Starting Download...' : 'Download Model'}
        </button>
      </form>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Tips for Direct URL Downloads</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc pl-5 space-y-1">
          <li>Make sure the URL points directly to the model file</li>
          <li>Supported file formats: .safetensors, .ckpt, .pt, .bin, .pth</li>
          <li>Aria2 will be used for faster downloads with multiple connections</li>
          <li>Large models may take some time to download</li>
        </ul>
      </div>
    </div>
  );
}
