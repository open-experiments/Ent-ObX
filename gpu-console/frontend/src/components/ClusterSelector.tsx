import { useState } from 'react';
import { ClusterConfig } from '../types';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ClusterSelectorProps {
  clusters: ClusterConfig[];
  selectedCluster: string;
  onSelectCluster: (name: string) => void;
  onAddCluster: (cluster: ClusterConfig) => void;
  onRemoveCluster: (name: string) => void;
}

export default function ClusterSelector({
  clusters,
  selectedCluster,
  onSelectCluster,
  onAddCluster,
  onRemoveCluster,
}: ClusterSelectorProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCluster, setNewCluster] = useState<ClusterConfig>({
    name: '',
    kubeconfigPath: '',
    namespace: 'nvidia-gpu-operator',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCluster(newCluster);
    setNewCluster({ name: '', kubeconfigPath: '', namespace: 'nvidia-gpu-operator' });
    setShowAddForm(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Clusters</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Cluster
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cluster Name
              </label>
              <input
                type="text"
                value={newCluster.name}
                onChange={(e) => setNewCluster({ ...newCluster, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Kubeconfig Path
              </label>
              <input
                type="text"
                value={newCluster.kubeconfigPath}
                onChange={(e) => setNewCluster({ ...newCluster, kubeconfigPath: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="/path/to/kubeconfig"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Add Cluster
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <div
          key="all-clusters"
          className={`flex items-center justify-between p-3 rounded cursor-pointer ${
            selectedCluster === 'all-clusters'
              ? 'bg-green-50 border-green-200 border'
              : 'bg-blue-50 hover:bg-blue-100'
          }`}
          onClick={() => onSelectCluster('all-clusters')}
        >
          <div>
            <h3 className="font-medium text-green-700">🌐 All Clusters</h3>
            <p className="text-sm text-green-600">View all clusters simultaneously</p>
          </div>
        </div>
        
        {clusters.map((cluster) => (
          <div
            key={cluster.name}
            className={`flex items-center justify-between p-3 rounded cursor-pointer ${
              selectedCluster === cluster.name
                ? 'bg-indigo-50 border-indigo-200 border'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => onSelectCluster(cluster.name)}
          >
            <div>
              <h3 className="font-medium">{cluster.name}</h3>
              <p className="text-sm text-gray-500">{cluster.kubeconfigPath}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveCluster(cluster.name);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}