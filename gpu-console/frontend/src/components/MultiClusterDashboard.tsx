import { ClusterGPUData } from '../types';
import GPUCard from './GPUCard';

interface MultiClusterDashboardProps {
  clusterData: Record<string, ClusterGPUData[]>;
  errors: Record<string, string>;
}

export default function MultiClusterDashboard({ clusterData, errors }: MultiClusterDashboardProps) {
  const clusterNames = Object.keys(clusterData);
  
  if (clusterNames.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🌐 All Clusters Dashboard</h2>
        <p className="text-gray-500">Loading GPU data from all clusters...</p>
      </div>
    );
  }

  const shouldUseHorizontalLayout = clusterNames.length <= 2;
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4">🌐 All Clusters Dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Clusters:</span> {clusterNames.length}
          </div>
          <div>
            <span className="font-medium">Total Nodes:</span>{' '}
            {Object.values(clusterData).reduce((total, nodes) => total + nodes.length, 0)}
          </div>
          <div>
            <span className="font-medium">Total GPUs:</span>{' '}
            {Object.values(clusterData).reduce(
              (total, nodes) => total + nodes.reduce((nodeTotal, node) => nodeTotal + node.gpus.length, 0),
              0
            )}
          </div>
        </div>
      </div>

      {/* Dynamic layout based on screen size and number of clusters */}
      <div className={`
        ${shouldUseHorizontalLayout 
          ? 'grid grid-cols-1 xl:grid-cols-2 gap-6' 
          : 'space-y-6'
        }
      `}>
        {clusterNames.map((clusterName) => {
        const nodes = clusterData[clusterName];
        const error = errors[clusterName];

        return (
          <div key={clusterName} className={`bg-white shadow rounded-lg p-4 md:p-6 ${
            shouldUseHorizontalLayout ? 'h-fit' : ''
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
                🖥️ {clusterName}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {error ? (
                  <span className="text-red-600 text-xs">❌ Error</span>
                ) : (
                  <>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {nodes.length} nodes
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {nodes.reduce((total, node) => total + node.gpus.length, 0)} GPUs
                    </span>
                  </>
                )}
              </div>
            </div>

            {error ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Failed to load GPU data for this cluster</p>
              </div>
            ) : nodes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading GPU data...</p>
              </div>
            ) : (
              <div className={`${shouldUseHorizontalLayout ? 'space-y-4' : 'space-y-6'}`}>
                {nodes.map((nodeData) => (
                  <div key={`${clusterName}-${nodeData.nodeName}`}>
                    <div className="mb-3 pb-2 border-b border-gray-200">
                      <h4 className="font-medium text-gray-700 text-sm md:text-base">
                        📡 {nodeData.nodeName}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          Driver: {nodeData.driverVersion}
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          CUDA: {nodeData.cudaVersion}
                        </span>
                      </div>
                    </div>
                    
                    <div className={`grid gap-4 ${
                      shouldUseHorizontalLayout 
                        ? 'grid-cols-1 xl:grid-cols-2' 
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    }`}>
                      {nodeData.gpus.map((gpu) => (
                        <GPUCard
                          key={`${clusterName}-${nodeData.nodeName}-${gpu.index}`}
                          gpu={gpu}
                          gpuIndex={gpu.index}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}