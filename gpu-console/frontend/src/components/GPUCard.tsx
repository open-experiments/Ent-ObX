import { GPUInfo } from '../types';
import PowerGauge from './visualizations/PowerGauge';
import MemoryBar from './visualizations/MemoryBar';
import TemperatureIndicator from './visualizations/TemperatureIndicator';
import MultiMetricChart from './visualizations/MultiMetricChart';

interface GPUCardProps {
  gpu: GPUInfo;
  gpuIndex: number;
  clusterName: string;
  nodeName: string;
}

export default function GPUCard({ gpu, gpuIndex, clusterName, nodeName }: GPUCardProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{gpu.name}</h3>
        <p className="text-sm text-gray-500">GPU {gpu.index} - {gpu.busId}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <PowerGauge
            key={`power-gauge-${gpu.index}`}
            powerUsage={gpu.powerUsage}
            powerCap={gpu.powerCap}
          />
        </div>
        <div>
          <TemperatureIndicator
            key={`temp-indicator-${gpu.index}`}
            temperature={gpu.temperature}
            fanSpeed={gpu.fanSpeed}
            gpuIndex={gpu.index}
          />
        </div>
      </div>

      <div className="space-y-4">
        <MemoryBar
          key={`memory-bar-${gpu.index}`}
          memoryUsed={gpu.memoryUsed}
          memoryTotal={gpu.memoryTotal}
        />
        
        <MultiMetricChart
          key={`multi-metric-chart-${gpuIndex}`}
          temperature={gpu.temperature}
          fanSpeed={gpu.fanSpeed}
          powerUsage={gpu.powerUsage}
          powerCap={gpu.powerCap}
          gpuUtilization={gpu.gpuUtilization}
          gpuIndex={gpuIndex}
          clusterName={clusterName}
          nodeName={nodeName}
        />
      </div>

      {gpu.processes.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Running Processes</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">PID</th>
                  <th className="text-left py-1">Type</th>
                  <th className="text-left py-1">Name</th>
                  <th className="text-right py-1">Memory</th>
                </tr>
              </thead>
              <tbody>
                {gpu.processes.map((process) => (
                  <tr key={process.pid} className="border-b">
                    <td className="py-1">{process.pid}</td>
                    <td className="py-1">{process.type}</td>
                    <td className="py-1">{process.processName}</td>
                    <td className="py-1 text-right">{process.gpuMemoryUsage} MiB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}