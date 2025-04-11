import { apiRequest } from '@/utils/apiUtils';

const API_BASE_URL = '/api';

export interface CustomNodeRepository {
  url: string;
  name?: string;
  branch?: string;
  description?: string;
}

export interface Requirement {
  id: string; // Add id field for compatibility with RequirementsManager
  name: string;
  version?: string;
  installed: boolean;
  installedVersion?: string;
  requiredBy: string[];
  isInstalling?: boolean;
  isUninstalling?: boolean;
}

export async function installCustomNode(repository: CustomNodeRepository) {
  return await apiRequest('post', `${API_BASE_URL}/custom-nodes/install`, repository);
}

export async function updateCustomNode(repositoryUrl: string) {
  return await apiRequest('post', `${API_BASE_URL}/custom-nodes/update`, { url: repositoryUrl });
}

export async function removeCustomNode(repositoryUrl: string) {
  return await apiRequest('post', `${API_BASE_URL}/custom-nodes/remove`, { url: repositoryUrl });
}

export async function reinstallRequirements(repositoryUrl?: string) {
  // If repositoryUrl is provided, reinstall requirements for that specific node
  // Otherwise, reinstall requirements for all custom nodes
  return await apiRequest('post', `${API_BASE_URL}/custom-nodes/reinstall-requirements`, 
    repositoryUrl ? { url: repositoryUrl } : {});
}

export async function getCustomNodesList() {
  return await apiRequest('get', `${API_BASE_URL}/custom-nodes/list`);
}

// Requirements management
export async function getRequirementsList() {
  try {
    const response = await apiRequest<{ requirements: Requirement[] }>('get', `${API_BASE_URL}/requirements/list`);
    // Ensure we always return requirements as an array
    if (response && Array.isArray(response)) {
      // If the API returns an array directly
      return response;
    } else if (response && response.requirements && Array.isArray(response.requirements)) {
      // If the API returns an object with a requirements array
      return response.requirements;
    } else {
      // Fallback to an empty array if the response format is unexpected
      console.error('Unexpected requirements list format:', response);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch requirements list:', error);
    return []; // Return empty array on error
  }
}

export async function installRequirement(packageName: string, version?: string) {
  return await apiRequest('post', `${API_BASE_URL}/requirements/install`, { 
    package: packageName,
    version
  });
}

export async function uninstallRequirement(packageName: string) {
  return await apiRequest('post', `${API_BASE_URL}/requirements/uninstall`, { 
    package: packageName 
  });
}

export async function checkRequirementStatus(packageName: string) {
  return await apiRequest('get', `${API_BASE_URL}/requirements/status`, undefined, {
    params: { package: packageName }
  });
}
