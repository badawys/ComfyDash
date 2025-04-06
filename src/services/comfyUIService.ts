import axios from 'axios';

// Use the backend API endpoints
const API_BASE_URL = '/api';

export async function startComfyUI() {
  try {
    const response = await axios.post(`${API_BASE_URL}/comfyui/start`);
    return response.data;
  } catch (error) {
    console.error('Error starting ComfyUI:', error);
    return { status: 'error', message: 'Failed to start ComfyUI' };
  }
}

export async function stopComfyUI() {
  try {
    const response = await axios.post(`${API_BASE_URL}/comfyui/stop`);
    return response.data;
  } catch (error) {
    console.error('Error stopping ComfyUI:', error);
    return { status: 'error', message: 'Failed to stop ComfyUI' };
  }
}

export async function getComfyUIStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/comfyui/status`);
    return response.data;
  } catch (error) {
    console.error('Error getting ComfyUI status:', error);
    return { status: 'unknown', message: 'Failed to get ComfyUI status' };
  }
}

export async function getComfyUILogs() {
  try {
    const response = await axios.get(`${API_BASE_URL}/comfyui/logs`);
    return response.data;
  } catch (error) {
    console.error('Error getting ComfyUI logs:', error);
    return { stdout: [], stderr: [], status: 'unknown', timestamp: Date.now() };
  }
}

export async function updateComfyUISettings(settings: any) {
  try {
    const response = await axios.post(`${API_BASE_URL}/comfyui/settings`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating ComfyUI settings:', error);
    return { status: 'error', message: 'Failed to update ComfyUI settings' };
  }
}

export async function getComfyUISettings() {
  try {
    const response = await axios.get(`${API_BASE_URL}/comfyui/settings`);
    return response.data;
  } catch (error) {
    console.error('Error getting ComfyUI settings:', error);
    return { status: 'error', message: 'Failed to get ComfyUI settings' };
  }
}

export async function installComfyUI(installPath?: string, method: 'git' | 'zip' = 'git') {
  try {
    const response = await axios.post(`${API_BASE_URL}/comfyui/install`, {
      install_path: installPath,
      method: method
    });
    return response.data;
  } catch (error) {
    console.error('Error installing ComfyUI:', error);
    return { status: 'error', message: 'Failed to install ComfyUI' };
  }
}

export async function getInstallStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/comfyui/install/status`);
    return response.data;
  } catch (error) {
    console.error('Error getting installation status:', error);
    return { status: 'error', message: 'Failed to get installation status' };
  }
}
