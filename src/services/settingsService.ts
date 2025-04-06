import axios from 'axios';

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
  refreshInterval?: number;
  selectedGpuId?: string;
  selectedStoragePath?: string;
}

export async function getSettings() {
  const response = await axios.get(`${API_BASE_URL}/settings`);
  return response.data;
}

export async function updateSettings(settings: Partial<AppSettings>) {
  const response = await axios.post(`${API_BASE_URL}/settings`, settings);
  return response.data;
}

export async function exportSettings() {
  const response = await axios.get(`${API_BASE_URL}/settings/export`, {
    responseType: 'blob'
  });
  
  // Create a download link for the settings file
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'comfyui-manager-settings.json');
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return { success: true };
}

export async function importSettings(file: File) {
  const formData = new FormData();
  formData.append('settings', file);
  
  const response = await axios.post(`${API_BASE_URL}/settings/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
}
