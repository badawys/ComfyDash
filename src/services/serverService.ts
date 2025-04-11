import axios from 'axios';
import { ServerStatus } from '@/types/settings';
import { apiRequest } from '@/utils/apiUtils';

const API_BASE_URL = '/api';

/**
 * Service for handling ComfyDash API server operations
 * This service is used to check the status of the ComfyDash backend API server
 * and to restart it if needed.
 */
export const serverService = {
  /**
   * Get the current status of the ComfyDash API server
   * This checks if the backend API server is running and responsive
   */
  getStatus: async (): Promise<ServerStatus> => {
    try {
      // Simple health check to see if the API server is responding
      const response = await apiRequest<{ status: ServerStatus }>('get', `${API_BASE_URL}/health`);
      return response?.status || 'running';
    } catch (error: any) {
      // If we get a 404 error or any network error, it means the API server is not running
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        console.warn('ComfyDash API server is not running (health check failed)');
        return 'stopped';
      }
      console.error('Error getting ComfyDash API server status:', error);
      return 'error';
    }
  },

  /**
   * Restart the ComfyDash API server
   * This will restart the backend API server, not the ComfyUI server
   */
  restart: async (): Promise<void> => {
    try {
      // Request a restart of the ComfyDash API server
      await apiRequest('post', `${API_BASE_URL}/server/restart`);
      
      // Wait a bit for the server to restart
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Poll for server availability
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        try {
          await apiRequest('get', `${API_BASE_URL}/health`);
          console.log('ComfyDash API server restarted successfully');
          return;
        } catch (error) {
          console.log(`Waiting for ComfyDash API server to come back online... (${attempts + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }
      
      throw new Error('ComfyDash API server failed to restart within the expected time');
    } catch (error) {
      console.error('Error restarting ComfyDash API server:', error);
      throw error;
    }
  },

  /**
   * Update ComfyDash API server configuration
   * This updates the configuration for the ComfyDash backend API server
   */
  updateConfig: async (config: {
    serverPort?: number;  // Frontend port (default: 8619)
    apiPort?: number;     // Backend API port (default: 8618)
    allowCors?: boolean;  // Whether to allow CORS
    debug?: boolean;      // Whether to enable debug mode
  }): Promise<void> => {
    try {
      await apiRequest('post', `${API_BASE_URL}/server/config`, config);
      console.log('ComfyDash API server configuration updated successfully');
    } catch (error) {
      console.error('Error updating ComfyDash API server config:', error);
      throw error;
    }
  }
};
