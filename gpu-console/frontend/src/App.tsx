import { useState, useEffect } from 'react';
import ClusterSelector from './components/ClusterSelector';
import GPUDashboard from './components/GPUDashboard';
import ClusterSummaryDashboard from './components/ClusterSummaryDashboard';
import MetricsSettings from './components/MetricsSettings';
import { ClusterConfig } from './types';
import { api } from './services/api';
import { useGPUData } from './hooks/useGPUData';
import { useMultiClusterGPUData } from './hooks/useMultiClusterGPUData';
import { CogIcon } from '@heroicons/react/24/outline';

function App() {
  const [clusters, setClusters] = useState<ClusterConfig[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Single cluster data
  const { gpuData, isLoading, error } = useGPUData(
    selectedCluster !== 'all-clusters' ? selectedCluster : ''
  );
  
  // Multi-cluster data
  const { clusterData, isLoading: isMultiLoading, errors } = useMultiClusterGPUData(
    selectedCluster === 'all-clusters' ? clusters : []
  );
  
  console.log('🚀 App render:', { 
    selectedCluster, 
    singleCluster: { gpuDataLength: gpuData.length, isLoading, error },
    multiCluster: { clusterCount: Object.keys(clusterData).length, isMultiLoading, errors }
  });

  useEffect(() => {
    loadClusters();
  }, []);


  const loadClusters = async () => {
    try {
      const response = await api.getClusters();
      setClusters(response.data);
    } catch (error) {
      console.error('Failed to load clusters:', error);
    }
  };

  const handleAddCluster = async (cluster: ClusterConfig) => {
    try {
      await api.addCluster(cluster);
      await loadClusters();
    } catch (error) {
      console.error('Failed to add cluster:', error);
    }
  };

  const handleRemoveCluster = async (name: string) => {
    try {
      await api.removeCluster(name);
      await loadClusters();
      if (selectedCluster === name) {
        setSelectedCluster('');
      }
    } catch (error) {
      console.error('Failed to remove cluster:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">GPU Console</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedCluster === 'all-clusters' ? (
                    isMultiLoading ? 'bg-yellow-500' : 
                    Object.keys(errors).length > 0 ? 'bg-orange-500' : 'bg-green-500'
                  ) : (
                    isLoading ? 'bg-yellow-500' : 
                    error ? 'bg-red-500' : 
                    selectedCluster ? 'bg-green-500' : 'bg-gray-400'
                  )
                }`}></div>
                <span className="text-sm text-gray-600">
                  {selectedCluster === 'all-clusters' ? (
                    isMultiLoading ? 'Loading all clusters...' : 
                    Object.keys(errors).length > 0 ? 'Some errors' : 'All clusters active'
                  ) : (
                    isLoading ? 'Loading...' : 
                    error ? 'Error' : 
                    selectedCluster ? 'Active' : 'Idle'
                  )}
                </span>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Metrics Settings"
              >
                <CogIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 md:py-6">
        <ClusterSelector
          clusters={clusters}
          selectedCluster={selectedCluster}
          onSelectCluster={setSelectedCluster}
          onAddCluster={handleAddCluster}
          onRemoveCluster={handleRemoveCluster}
        />
        
        {selectedCluster === 'all-clusters' ? (
          <ClusterSummaryDashboard clusterData={clusterData} errors={errors} />
        ) : selectedCluster ? (
          <GPUDashboard clusterName={selectedCluster} gpuData={gpuData} />
        ) : null}
      </main>
      
      <MetricsSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default App;