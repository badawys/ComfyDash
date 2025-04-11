import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Makes an API request with enhanced error handling
 * @param method - HTTP method (get, post, etc.)
 * @param url - API endpoint URL
 * @param data - Request payload (for POST, PUT, etc.)
 * @param config - Additional axios config
 * @returns Promise with response data or error
 */
export async function apiRequest<T = any>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    let response: AxiosResponse<T>;
    
    if (method === 'get') {
      response = await axios.get<T>(url, config);
    } else if (method === 'post') {
      response = await axios.post<T>(url, data, config);
    } else if (method === 'put') {
      response = await axios.put<T>(url, data, config);
    } else if (method === 'delete') {
      response = await axios.delete<T>(url, config);
    } else {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    return response.data;
  } catch (error: any) {
    // Enhanced error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // For health endpoint errors, handle them differently as they're used to determine server status
      if (url.includes('/health')) {
        // For health endpoint, we want to propagate the error to the serverService
        // so it can determine if the server is running or not
        throw error;
      } else {
        try {
          console.error(`API Error (${url}):`, {
            status: error.response?.status || 'unknown',
            statusText: error.response?.statusText || 'No status text',
            data: error.response?.data || {}
          });
        } catch (logError) {
          // Fallback if there's an issue with logging the error
          console.error(`API Error (${url}):`, error);
        }
      }
      
      // Return a default value based on the endpoint
      if (url.includes('/custom-nodes/list')) {
        console.warn('Returning default empty custom nodes list due to API error');
        return { installed: [], available: [] } as unknown as T;
      } else if (url.includes('/requirements/list')) {
        console.warn('Returning default empty requirements list due to API error');
        // Return a properly formatted requirements list with an empty array
        return { requirements: [] } as unknown as T;
      } else if (url.includes('/models/list')) {
        console.warn('Returning default empty models list due to API error');
        return { models: [], categories: [] } as unknown as T;
      } else if (url.includes('/server/status')) {
        console.warn('Returning default ComfyUI server status due to API error');
        return { status: 'unknown' } as unknown as T;
      } else if (url.includes('/health')) {
        // For health endpoint, we've already thrown the error above
        // This code should not be reached, but just in case
        throw error;
      } else if (url.includes('/server/restart')) {
        console.warn('Failed to restart ComfyDash API server');
        throw new Error('Failed to restart ComfyDash API server');
      } else if (url.includes('/system/available-gpus')) {
        console.warn('Returning default GPU info due to API error');
        return [{ id: '0', name: 'Default GPU', driver: 'Unknown' }] as unknown as T;
      } else if (url.includes('/system/available-storage')) {
        return [{ 
          id: '0', 
          path: '/', 
          device: 'Unknown', 
          fstype: 'Unknown', 
          total_gb: 0, 
          used_gb: 0, 
          free_gb: 0, 
          percent_used: 0 
        }] as unknown as T;
      }
      
      // For other endpoints, throw a more informative error
      const status = error.response?.status || 'unknown';
      const message = error.response?.data?.message || error.response?.statusText || 'Unknown error';
      throw new Error(`API Error (${status}): ${message}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error (No Response):', error.request);
      throw new Error('No response received from server. Please check your network connection.');
    } else {
      // Something happened in setting up the request
      console.error('API Request Setup Error:', error.message);
      throw new Error(`Error setting up request: ${error.message}`);
    }
  }
}
