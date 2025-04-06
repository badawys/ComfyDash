import axios from 'axios';

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
  const response = await axios.post(`${API_BASE_URL}/models/download`, request);
  return response.data;
}

export async function getDownloadStatus(downloadId: string) {
  const response = await axios.get(`${API_BASE_URL}/models/status/${downloadId}`);
  return response.data;
}

export async function searchCivitAIModels(query: string, type?: string, page: number = 1) {
  const response = await axios.get(`${API_BASE_URL}/models/civitai/search`, {
    params: { query, type, page }
  });
  return response.data;
}

export async function searchHuggingFaceModels(query: string, type?: string, page: number = 1) {
  const response = await axios.get(`${API_BASE_URL}/models/huggingface/search`, {
    params: { query, type, page }
  });
  return response.data;
}

export async function getModelsList() {
  const response = await axios.get(`${API_BASE_URL}/models/list`);
  return response.data;
}
