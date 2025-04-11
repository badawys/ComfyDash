import axios from 'axios';
import { GpuInfo, StorageLocation } from '@/types/settings';

/**
 * Service for handling system monitoring operations
 */
export const monitoringService = {
  /**
   * Get available GPUs in the system
   */
  getAvailableGpus: async (): Promise<GpuInfo[]> => {
    try {
      const response = await axios.get('/api/system/available-gpus');
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
  },

  /**
   * Get available storage locations in the system
   */
  getAvailableStorageLocations: async (): Promise<StorageLocation[]> => {
    try {
      const response = await axios.get('/api/system/available-storage');
      return response.data;
    } catch (error) {
      console.error('Error fetching available storage locations:', error);
      // Return a default storage location in case of error
      return [{
        id: '0',
        path: '/',
        device: 'Unknown',
        fstype: 'Unknown',
        total_gb: 0,
        used_gb: 0,
        free_gb: 0,
        percent_used: 0
      }];
    }
  },

  /**
   * Get system stats
   */
  getSystemStats: async (refreshInterval: number = 1000) => {
    try {
      const response = await axios.get(`/api/system/stats?interval=${Math.max(100, refreshInterval)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      // Return default stats in case of error
      return {
        cpu: {
          usage: 0,
          temperature: 0,
          cores: 0
        },
        memory: {
          total: 0,
          used: 0,
          free: 0,
          percent_used: 0
        },
        gpu: {
          name: 'Unknown',
          usage: 0,
          temperature: 0,
          memory_total: 0,
          memory_used: 0,
          memory_free: 0,
          memory_percent_used: 0
        }
      };
    }
  }
};
