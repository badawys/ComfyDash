"use client";

import { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { 
  getRequirementsList, 
  installRequirement, 
  uninstallRequirement,
  checkRequirementStatus
} from '@/services/customNodesService';

// Import the Requirement interface from customNodesService to ensure consistency
import { Requirement as ServiceRequirement } from '@/services/customNodesService';

// Extend the service interface to ensure all required fields are present
interface Requirement extends ServiceRequirement {
  id: string; // Ensure id is required
}

export default function RequirementsManager() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPackage, setNewPackage] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [filter, setFilter] = useState<'all' | 'installed' | 'missing'>('all');

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      setError(null);
      // Define a type for the possible response formats
      type RequirementsResponse = 
        | ServiceRequirement[] 
        | { requirements: ServiceRequirement[] };
      
      const data = await getRequirementsList() as RequirementsResponse;
      // Process the requirements data to ensure it has all required fields
      let requirementsList: Requirement[] = [];
      
      if (data && Array.isArray(data)) {
        // If data is already an array
        requirementsList = data.map((req: ServiceRequirement) => ({
          ...req,
          id: req.id || req.name // Use name as fallback ID if not provided
        }));
      } else if (data && typeof data === 'object' && 'requirements' in data && Array.isArray(data.requirements)) {
        // If data is an object with a requirements array
        requirementsList = data.requirements.map((req: ServiceRequirement) => ({
          ...req,
          id: req.id || req.name // Use name as fallback ID if not provided
        }));
      } else {
        console.error('Invalid requirements data format:', data);
        setError('Failed to load requirements data. Invalid format received.');
      }
      
      setRequirements(requirementsList);
    } catch (error: any) {
      console.error('Error fetching requirements:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch requirements');
      setRequirements([]); // Ensure requirements is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPackage.trim()) {
      setError('Package name is required');
      return;
    }
    
    try {
      setIsInstalling(true);
      setError(null);
      
      await installRequirement(newPackage.trim());
      
      // Reset form
      setNewPackage('');
      
      // Refresh the list
      fetchRequirements();
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to install package');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleInstallRequirement = async (requirement: Requirement) => {
    try {
      // Update local state to show installing status
      setRequirements(prev => prev.map(r => 
        r.id === requirement.id ? { ...r, isInstalling: true } : r
      ));
      
      await installRequirement(requirement.name, requirement.version);
      
      // Check status after installation
      const status = await checkRequirementStatus(requirement.name);
      
      // Update local state with new status
      setRequirements(prev => prev.map(r => 
        r.id === requirement.id ? { 
          ...r, 
          installed: status.installed,
          installedVersion: status.version,
          isInstalling: false 
        } : r
      ));
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || `Failed to install ${requirement.name}`);
      
      // Reset installing status on error
      setRequirements(prev => prev.map(r => 
        r.id === requirement.id ? { ...r, isInstalling: false } : r
      ));
    }
  };

  const handleUninstall = async (requirement: Requirement) => {
    if (!confirm(`Are you sure you want to uninstall ${requirement.name}?`)) {
      return;
    }
    
    try {
      // Update local state to show uninstalling status
      setRequirements(prev => prev.map(r => 
        r.id === requirement.id ? { ...r, isUninstalling: true } : r
      ));
      
      await uninstallRequirement(requirement.name);
      
      // Check status after uninstallation
      const status = await checkRequirementStatus(requirement.name);
      
      // Update local state with new status
      setRequirements(prev => prev.map(r => 
        r.id === requirement.id ? { 
          ...r, 
          installed: status.installed,
          installedVersion: status.version,
          isUninstalling: false 
        } : r
      ));
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || `Failed to uninstall ${requirement.name}`);
      
      // Reset uninstalling status on error
      setRequirements(prev => prev.map(r => 
        r.id === requirement.id ? { ...r, isUninstalling: false } : r
      ));
    }
  };

  // Ensure requirements is always an array before filtering
  const filteredRequirements = (requirements || []).filter(req => {
    if (filter === 'installed') return req.installed;
    if (filter === 'missing') return !req.installed;
    return true;
  });

  return (
    <div className="space-y-6">
      <form onSubmit={handleInstall} className="space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
        <h3 className="text-lg font-medium">Install Python Package</h3>
        
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="packageName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Package Name (with optional version)
            </label>
            <input
              type="text"
              id="packageName"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="package-name==1.0.0 or just package-name"
              value={newPackage}
              onChange={(e) => setNewPackage(e.target.value)}
              required
            />
          </div>
          
          <div className="self-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isInstalling}
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
          </div>
        </div>
      </form>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Python Requirements</h3>
          
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-md ${filter === 'installed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
              onClick={() => setFilter('installed')}
            >
              Installed
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-md ${filter === 'missing' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
              onClick={() => setFilter('missing')}
            >
              Missing
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading requirements...</div>
        ) : filteredRequirements.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No {filter !== 'all' ? filter : ''} requirements found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Package
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Required Version
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Installed Version
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Required By
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredRequirements.map((req) => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {req.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {req.version || 'Any'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {req.installedVersion || 'Not installed'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.installed ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {req.installed ? 'Installed' : 'Missing'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {req.requiredBy.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {req.requiredBy.map((repo, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                              {repo.split('/').pop()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        'Manual install'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {req.installed ? (
                        <button
                          onClick={() => handleUninstall(req)}
                          disabled={req.isUninstalling || req.isInstalling}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          {req.isUninstalling ? 'Uninstalling...' : 'Uninstall'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInstallRequirement(req)}
                          disabled={req.isInstalling || req.isUninstalling}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                        >
                          {req.isInstalling ? 'Installing...' : 'Install'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
