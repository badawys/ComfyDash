import { apiRequest } from '@/utils/apiUtils';

const API_BASE_URL = '/api';

export type ModelSource = 'civitai' | 'huggingface' | 'url';

export interface ModelDownloadRequest {
  source: ModelSource;
  modelId?: string; // For CivitAI or HuggingFace
  url?: string; // For direct URL downloads
  modelName?: string; // Optional custom name
  modelType: string; // The type of model (checkpoint, lora, etc.)
  targetPath?: string; // Optional custom path override
}

export async function downloadModel(request: ModelDownloadRequest) {
  return await apiRequest('post', `${API_BASE_URL}/models/download`, request);
}

export async function getDownloadStatus(downloadId: string) {
  return await apiRequest('get', `${API_BASE_URL}/models/status/${downloadId}`);
}

export async function searchCivitAIModels(query: string, type?: string, page: number = 1) {
  return await apiRequest('get', `${API_BASE_URL}/models/search/civitai`, undefined, {
    params: { query, type, page }
  });
}

export async function searchHuggingFaceModels(query: string, type?: string, page: number = 1) {
  return await apiRequest('get', `${API_BASE_URL}/models/search/huggingface`, undefined, {
    params: { query, type, page }
  });
}

export async function getModelsList() {
  try {
    return await apiRequest('get', `${API_BASE_URL}/models/list`);
  } catch (error) {
    console.error('Error fetching models list:', error);
    // Return a default empty models list if the API call fails
    return {
      models: [],
      categories: []
    };
  }
}
