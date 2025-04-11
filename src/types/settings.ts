// Define types for settings

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

// Define tab types for the settings page
export type TabType = 'general' | 'paths' | 'server' | 'appearance' | 'monitoring' | 'api-keys' | 'import-export';

// Settings interface
export interface Settings {
  civitaiApiKey?: string;
  huggingfaceApiKey?: string;
  comfyUIPath?: string;
  modelsPath?: string;
  customNodesPath?: string;
  customPaths?: Record<string, string>;
  autoUpdateCustomNodes?: boolean;
  startComfyUIOnBoot?: boolean;
  gpuMonitoringEnabled?: boolean;
  theme?: 'light' | 'dark' | 'system';
  refreshInterval?: number;
  selectedGpuId?: string;
  selectedStoragePath?: string;
  // Server configuration settings
  apiPort?: number;
  serverPort?: number;
  debug?: boolean;
  allowCors?: boolean;
  enableCors?: boolean;
}

export type ServerStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'unknown';
