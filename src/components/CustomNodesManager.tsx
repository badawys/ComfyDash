"use client";

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { 
  getCustomNodesList, 
  installCustomNode, 
  updateCustomNode, 
  removeCustomNode,
  CustomNodeRepository 
} from '@/services/customNodesService';

interface CustomNode extends CustomNodeRepository {
  id: string;
  installed: boolean;
  installDate?: string;
  lastUpdate?: string;
  version?: string;
  isUpdating?: boolean;
  isRemoving?: boolean;
}

export default function CustomNodesManager() {
  const [nodes, setNodes] = useState<CustomNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoBranch, setNewRepoBranch] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomNodesList();
      setNodes(data.nodes);
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to fetch custom nodes');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRepoUrl.trim()) {
      setError('Repository URL is required');
      return;
    }
    
    try {
      setIsInstalling(true);
      setError(null);
      
      await installCustomNode({
        url: newRepoUrl.trim(),
        name: newRepoName.trim() || undefined,
        branch: newRepoBranch.trim() || undefined,
      });
      
      // Reset form
      setNewRepoUrl('');
      setNewRepoName('');
      setNewRepoBranch('');
      
      // Refresh the list
      fetchNodes();
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to install custom node');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = async (node: CustomNode) => {
    try {
      // Update local state to show updating status
      setNodes(prev => prev.map(n => 
        n.id === node.id ? { ...n, isUpdating: true } : n
      ));
      
      await updateCustomNode(node.url);
      
      // Refresh the list
      fetchNodes();
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || `Failed to update ${node.name || node.url}`);
      
      // Reset updating status on error
      setNodes(prev => prev.map(n => 
        n.id === node.id ? { ...n, isUpdating: false } : n
      ));
    }
  };

  const handleRemove = async (node: CustomNode) => {
    if (!confirm(`Are you sure you want to remove ${node.name || node.url}?`)) {
      return;
    }
    
    try {
      // Update local state to show removing status
      setNodes(prev => prev.map(n => 
        n.id === node.id ? { ...n, isRemoving: true } : n
      ));
      
      await removeCustomNode(node.url);
      
      // Refresh the list
      fetchNodes();
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || `Failed to remove ${node.name || node.url}`);
      
      // Reset removing status on error
      setNodes(prev => prev.map(n => 
        n.id === node.id ? { ...n, isRemoving: false } : n
      ));
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleInstall} className="space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
        <h3 className="text-lg font-medium">Add New Custom Node</h3>
        
        <div>
          <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            GitHub Repository URL*
          </label>
          <input
            type="text"
            id="repoUrl"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="https://github.com/username/repo"
            value={newRepoUrl}
            onChange={(e) => setNewRepoUrl(e.target.value)}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="repoName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom Name (Optional)
            </label>
            <input
              type="text"
              id="repoName"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Friendly name for the node"
              value={newRepoName}
              onChange={(e) => setNewRepoName(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="repoBranch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Branch (Optional)
            </label>
            <input
              type="text"
              id="repoBranch"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="main"
              value={newRepoBranch}
              onChange={(e) => setNewRepoBranch(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isInstalling}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            {isInstalling ? 'Installing...' : 'Add Custom Node'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Installed Custom Nodes</h3>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading custom nodes...</div>
        ) : nodes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No custom nodes installed. Add a GitHub repository above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Repository
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Branch
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {nodes.map((node) => (
                  <tr key={node.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {node.name || 'Unnamed'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <a 
                        href={node.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {node.url.replace('https://github.com/', '')}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {node.branch || 'default'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {node.lastUpdate ? new Date(node.lastUpdate).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleUpdate(node)}
                          disabled={node.isUpdating || node.isRemoving}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                          title="Update"
                        >
                          <ArrowPathIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRemove(node)}
                          disabled={node.isUpdating || node.isRemoving}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          title="Remove"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
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
