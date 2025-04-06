// Type declarations for modules
declare module '@/components/*' {
  const component: React.ComponentType<any>;
  export default component;
}

// Declare system service
declare module '@/services/systemService' {
  export function fetchSystemStats(): Promise<any>;
  export function fetchSystemInfo(): Promise<any>;
  export function fetchStorageInfo(): Promise<any>;
}

// Declare model service
declare module '@/services/modelService' {
  export type ModelSource = 'civitai' | 'huggingface' | 'url';
  
  export interface ModelDownloadRequest {
    source: ModelSource;
    modelId?: string;
    url?: string;
    modelName?: string;
    modelType: string;
    targetPath?: string;
  }
  
  export function downloadModel(request: ModelDownloadRequest): Promise<any>;
  export function getDownloadStatus(downloadId: string): Promise<any>;
  export function searchCivitAIModels(query: string, type?: string, page?: number): Promise<any>;
  export function searchHuggingFaceModels(query: string, type?: string, page?: number): Promise<any>;
  export function getModelsList(): Promise<any>;
}

// Add custom event types
interface WindowEventMap {
  'new-download': CustomEvent;
}
