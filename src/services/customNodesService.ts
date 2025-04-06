import axios from 'axios';

const API_BASE_URL = '/api';

export interface CustomNodeRepository {
  url: string;
  name?: string;
  branch?: string;
  description?: string;
}

export interface Requirement {
  name: string;
  version?: string;
  installed: boolean;
  installedVersion?: string;
  requiredBy: string[];
}

export async function installCustomNode(repository: CustomNodeRepository) {
  const response = await axios.post(`${API_BASE_URL}/custom-nodes/install`, repository);
  return response.data;
}

export async function updateCustomNode(repositoryUrl: string) {
  const response = await axios.post(`${API_BASE_URL}/custom-nodes/update`, { url: repositoryUrl });
  return response.data;
}

export async function removeCustomNode(repositoryUrl: string) {
  const response = await axios.post(`${API_BASE_URL}/custom-nodes/remove`, { url: repositoryUrl });
  return response.data;
}

export async function reinstallRequirements(repositoryUrl?: string) {
  // If repositoryUrl is provided, reinstall requirements for that specific node
  // Otherwise, reinstall requirements for all custom nodes
  const response = await axios.post(`${API_BASE_URL}/custom-nodes/reinstall-requirements`, 
    repositoryUrl ? { url: repositoryUrl } : {});
  return response.data;
}

export async function getCustomNodesList() {
  const response = await axios.get(`${API_BASE_URL}/custom-nodes/list`);
  return response.data;
}

// Requirements management
export async function getRequirementsList() {
  const response = await axios.get(`${API_BASE_URL}/requirements/list`);
  return response.data;
}

export async function installRequirement(packageName: string, version?: string) {
  const response = await axios.post(`${API_BASE_URL}/requirements/install`, { 
    package: packageName,
    version
  });
  return response.data;
}

export async function uninstallRequirement(packageName: string) {
  const response = await axios.post(`${API_BASE_URL}/requirements/uninstall`, { 
    package: packageName 
  });
  return response.data;
}

export async function checkRequirementStatus(packageName: string) {
  const response = await axios.get(`${API_BASE_URL}/requirements/status`, {
    params: { package: packageName }
  });
  return response.data;
}
