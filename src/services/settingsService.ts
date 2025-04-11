import axios from 'axios';
import { apiRequest } from '@/utils/apiUtils';

const API_BASE_URL = '/api';

export interface AppSettings {
  comfyUIPath: string;
  modelsPath: string;
  customNodesPath: string;
  customPaths: Record<string, string>;
  comfyUIPort: number;
  comfyUIArgs: string;
  civitaiApiKey?: string;
  huggingfaceApiKey?: string;
  refreshInterval: number; // Default to 1000ms (1 second)
  selectedGpuId?: string;
  selectedStoragePath?: string;
  gpuMonitoringEnabled?: boolean;
  // Server configuration settings (previously in .env)
  apiPort?: number;
  debug?: boolean;
  allowCors?: boolean;
}

export async function getSettings() {
  try {
    return await apiRequest('get', `${API_BASE_URL}/settings`);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    // Return default settings if the API call fails
    return {
      comfyUIPath: '',
      modelsPath: '',
      customNodesPath: '',
      customPaths: {},
      comfyUIPort: 8188,
      comfyUIArgs: '',
      refreshInterval: 1000, // Default to 1 second as per memory
      apiPort: 8618, // Default port as per memory
      debug: false,
      allowCors: true
    };
  }
}

export async function updateSettings(settings: Partial<AppSettings>) {
  return await apiRequest('post', `${API_BASE_URL}/settings`, settings);
}

export async function exportSettings() {
  try {
    // Get current settings, custom nodes, and models for a complete export
    const settings = await getSettings();
    const customNodesResponse = await apiRequest('get', `${API_BASE_URL}/custom-nodes/list`);
    const modelsResponse = await apiRequest('get', `${API_BASE_URL}/models/list`);
    
    // Create a comprehensive export object
    const exportData = {
      settings,
      customNodes: customNodesResponse?.installed || [],
      models: modelsResponse?.models || []
    };
    
    // Convert to JSON and create a blob
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Create a download link for the export file
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'comfyui-manager-export.json');
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return { success: true };
  } catch (error) {
    console.error('Failed to export data:', error);
    throw new Error('Failed to export data. Please try again.');
  }
}

export async function importSettings(file: File) {
  try {
    // Read the file content as text
    const fileContent = await file.text();
    let importData;
    
    try {
      // Parse the JSON content
      importData = JSON.parse(fileContent);
    } catch (parseError) {
      console.error('Failed to parse import file:', parseError);
      throw new Error('Invalid JSON format in the import file.');
    }
    
    // Check if this is a new format export (with settings, customNodes, and models)
    // or legacy format (settings only)
    const isNewFormat = importData.settings && (importData.customNodes || importData.models);
    
    // Import settings
    if (isNewFormat) {
      // New format - extract settings from the object
      await updateSettings(importData.settings);
    } else {
      // Legacy format - the entire object is settings
      await updateSettings(importData);
    }
    
    // Return the imported data for further processing (like checking for missing items)
    return { 
      success: true, 
      data: importData,
      isNewFormat
    };
  } catch (error) {
    console.error('Failed to import data:', error);
    throw new Error('Failed to import data. Please check the file format and try again.');
  }
}

// Check for missing custom nodes and models after import
export async function checkMissingItems(importData: any) {
  try {
    // If it's not the new format, there's nothing to check
    if (!importData.customNodes && !importData.models) {
      return { missingCustomNodes: [], missingModels: [] };
    }
    
    // Get current custom nodes and models
    const customNodesResponse = await apiRequest('get', `${API_BASE_URL}/custom-nodes/list`);
    const modelsResponse = await apiRequest('get', `${API_BASE_URL}/models/list`);
    
    const installedCustomNodes = customNodesResponse?.installed || [];
    const installedModels = modelsResponse?.models || [];
    
    // Create maps of installed items for quick lookup
    const customNodeMap = new Map(installedCustomNodes.map((node: any) => [node.url, node]));
    const modelMap = new Map(installedModels.map((model: any) => [model.path, model]));
    
    // Find missing custom nodes
    const missingCustomNodes = (importData.customNodes || []).filter((node: any) => !customNodeMap.has(node.url));
    
    // Find missing models
    const missingModels = (importData.models || []).filter((model: any) => !modelMap.has(model.path));
    
    return { missingCustomNodes, missingModels };
  } catch (error) {
    console.error('Failed to check missing items:', error);
    return { missingCustomNodes: [], missingModels: [] };
  }
}
