import { ClusterGPUData } from '../types';
import GPUCard from './GPUCard';

interface GPUDashboardProps {
  clusterName: string;
  gpuData: ClusterGPUData[];
}

export default function GPUDashboard({ clusterName, gpuData }: GPUDashboardProps) {
  console.log('🖥️ GPUDashboard render:', { clusterName, gpuDataLength: gpuData.length, gpuData });
  
  if (gpuData.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">GPU Dashboard - {clusterName}</h2>
        <p className="text-gray-500">Loading GPU data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">GPU Dashboard - {clusterName}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Driver Version:</span> {gpuData[0]?.driverVersion}
          </div>
          <div>
            <span className="font-medium">CUDA Version:</span> {gpuData[0]?.cudaVersion}
          </div>
        </div>
      </div>

      {gpuData.map((nodeData) => (
        <div key={nodeData.nodeName} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Node: {nodeData.nodeName}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {nodeData.gpus.map((gpu) => (
              <GPUCard 
                key={`${clusterName}-${nodeData.nodeName}-gpu-${gpu.index}`} 
                gpu={gpu} 
                gpuIndex={gpu.index}
                clusterName={clusterName}
                nodeName={nodeData.nodeName}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}