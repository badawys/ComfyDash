import axios from 'axios';

// Use the backend API endpoints
const API_BASE_URL = '/api';

// Interface for GPU information
export interface GpuInfo {
  id: string;
  name: string;
  driver: string;
}

// Interface for storage location information
export interface StorageLocation {
  id: string;
  path: string;
  device: string;
  fstype: string;
  total_gb: number;
  used_gb: number;
  free_gb: number;
  percent_used: number;
}

export async function fetchSystemStats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/system/stats`);
    const data = response.data;
    
    // Transform the backend API response to match what the frontend components expect
    return {
      gpu_usage: data?.gpu?.usage || 0,
      vram_usage: data?.gpu?.memory?.percent || Math.round((data?.gpu?.memory?.used / Math.max(data?.gpu?.memory?.total, 1)) * 100) || 0,
      cpu_usage: data?.cpu?.usage || 0,
      ram_usage: data?.ram?.percent || 0,
      gpu_name: 'GPU'
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    // Return default values in case of error
    return {
      gpu_usage: 0,
      vram_usage: 0,
      cpu_usage: 0,
      ram_usage: 0,
      gpu_name: 'Unknown'
    };
  }
}

export async function fetchSystemInfo() {
  try {
    const response = await axios.get(`${API_BASE_URL}/system/info`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system info:', error);
    // Return default values in case of error
    return {
      os: 'Unknown',
      cpu: 'Unknown',
      gpu: 'Unknown',
      memory: 'Unknown',
      python_version: 'Unknown'
    };
  }
}

export async function fetchStorageInfo() {
  try {
    const response = await axios.get(`${API_BASE_URL}/system/storage`);
    return response.data;
  } catch (error) {
    console.error('Error fetching storage info:', error);
    // Return default values in case of error
    return {
      disk_total: 0,
      disk_used: 0,
      disk_free: 0,
      models_size: 0
    };
  }
}

export const fetchAvailableGPUs = async (): Promise<GpuInfo[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/system/available-gpus`);
    return response.data;
  } catch (error) {
    console.error('Error fetching available GPUs:', error);
    // Return a default GPU in case of error
    return [{
      id: '0',
      name: 'Default GPU',
      driver: 'Unknown'
    }];
  }
}

export const fetchAvailableStorageLocations = async (): Promise<StorageLocation[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/system/available-storage`);
    return response.data;
  } catch (error) {
    console.error('Error fetching available storage locations:', error);
    // Return a default storage location in case of error
    return [{
      id: '0',
      path: '/',
      device: 'Default',
      fstype: 'Unknown',
      total_gb: 0,
      used_gb: 0,
      free_gb: 0,
      percent_used: 0
    }];
  }
}
