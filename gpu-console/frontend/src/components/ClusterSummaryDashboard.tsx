import { useMemo } from 'react';
import { ClusterGPUData } from '../types';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ClusterSummaryDashboardProps {
  clusterData: Record<string, ClusterGPUData[]>;
  errors: Record<string, string>;
}

export default function ClusterSummaryDashboard({ clusterData, errors }: ClusterSummaryDashboardProps) {
  const summaryStats = useMemo(() => {
    const allGPUs = Object.values(clusterData).flat().flatMap(node => node.gpus);
    
    if (allGPUs.length === 0) {
      return {
        totalGPUs: 0,
        avgPowerUsage: 0,
        totalPowerUsage: 0,
        maxPowerCap: 0,
        avgMemoryUsage: 0,
        avgTemperature: 0,
        avgGPUUtilization: 0,
        maxTemperature: 0,
        hotGPUs: 0,
        activeGPUs: 0
      };
    }

    const totalGPUs = allGPUs.length;
    const totalPowerUsage = allGPUs.reduce((sum, gpu) => sum + gpu.powerUsage, 0);
    const maxPowerCap = allGPUs.reduce((sum, gpu) => sum + gpu.powerCap, 0);
    const avgPowerUsage = Math.round(totalPowerUsage / totalGPUs);
    
    const totalMemoryUsed = allGPUs.reduce((sum, gpu) => sum + gpu.memoryUsed, 0);
    const totalMemoryTotal = allGPUs.reduce((sum, gpu) => sum + gpu.memoryTotal, 0);
    const avgMemoryUsage = Math.round((totalMemoryUsed / totalMemoryTotal) * 100);
    
    const avgTemperature = Math.round(allGPUs.reduce((sum, gpu) => sum + gpu.temperature, 0) / totalGPUs);
    const maxTemperature = Math.max(...allGPUs.map(gpu => gpu.temperature));
    const hotGPUs = allGPUs.filter(gpu => gpu.temperature > 80).length;
    
    const avgGPUUtilization = Math.round(allGPUs.reduce((sum, gpu) => sum + gpu.gpuUtilization, 0) / totalGPUs);
    const activeGPUs = allGPUs.filter(gpu => gpu.gpuUtilization > 5).length;

    return {
      totalGPUs,
      avgPowerUsage,
      totalPowerUsage: Math.round(totalPowerUsage),
      maxPowerCap: Math.round(maxPowerCap),
      avgMemoryUsage,
      avgTemperature,
      avgGPUUtilization,
      maxTemperature,
      hotGPUs,
      activeGPUs
    };
  }, [clusterData]);

  const createGaugeData = (value: number, max: number, color: string) => ({
    datasets: [{
      data: [value, max - value],
      backgroundColor: [color, '#e5e7eb'],
      borderWidth: 0,
      cutout: '75%',
      rotation: -90,
      circumference: 180,
    }],
  });

  const gaugeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 80) return '#ef4444'; // red
    if (temp > 60) return '#f59e0b'; // amber
    return '#10b981'; // green
  };

  const getPowerColor = (usage: number, max: number) => {
    const percentage = (usage / max) * 100;
    if (percentage > 80) return '#ef4444'; // red
    if (percentage > 60) return '#f59e0b'; // amber
    return '#10b981'; // green
  };

  const getUtilizationColor = (util: number) => {
    if (util > 80) return '#10b981'; // green (high utilization is good)
    if (util > 40) return '#f59e0b'; // amber
    return '#ef4444'; // red (low utilization)
  };

  const clusterNames = Object.keys(clusterData);
  const errorCount = Object.keys(errors).length;

  if (clusterNames.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🌐 Infrastructure Summary</h2>
        <p className="text-gray-500">Loading GPU data from all clusters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">🌐 GPU Infrastructure Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{clusterNames.length}</div>
            <div className="text-sm text-gray-600">Clusters</div>
            {errorCount > 0 && <div className="text-xs text-red-500">{errorCount} errors</div>}
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{summaryStats.totalGPUs}</div>
            <div className="text-sm text-gray-600">Total GPUs</div>
            <div className="text-xs text-green-500">{summaryStats.activeGPUs} active</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{summaryStats.totalPowerUsage}W</div>
            <div className="text-sm text-gray-600">Total Power</div>
            <div className="text-xs text-gray-500">of {summaryStats.maxPowerCap}W</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{summaryStats.maxTemperature}°C</div>
            <div className="text-sm text-gray-600">Max Temp</div>
            {summaryStats.hotGPUs > 0 && <div className="text-xs text-red-500">{summaryStats.hotGPUs} hot GPUs</div>}
          </div>
        </div>
      </div>

      {/* Summary Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Average Power Usage Gauge */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Power Usage</h3>
          <div className="relative h-32">
            <Doughnut
              data={createGaugeData(
                summaryStats.avgPowerUsage,
                500, // Max reasonable power for visualization
                getPowerColor(summaryStats.totalPowerUsage, summaryStats.maxPowerCap)
              )}
              options={gaugeOptions}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{summaryStats.avgPowerUsage}W</div>
                <div className="text-xs text-gray-500">avg per GPU</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              Total: {summaryStats.totalPowerUsage}W / {summaryStats.maxPowerCap}W
            </div>
            <div className="text-xs text-gray-500">
              {Math.round((summaryStats.totalPowerUsage / summaryStats.maxPowerCap) * 100)}% capacity
            </div>
          </div>
        </div>

        {/* Memory Usage Gauge */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Memory Usage</h3>
          <div className="relative h-32">
            <Doughnut
              data={createGaugeData(summaryStats.avgMemoryUsage, 100, '#3b82f6')}
              options={gaugeOptions}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{summaryStats.avgMemoryUsage}%</div>
                <div className="text-xs text-gray-500">average</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">Across all GPUs</div>
          </div>
        </div>

        {/* Temperature Gauge */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Temperature</h3>
          <div className="relative h-32">
            <Doughnut
              data={createGaugeData(
                summaryStats.avgTemperature,
                100,
                getTemperatureColor(summaryStats.avgTemperature)
              )}
              options={gaugeOptions}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{summaryStats.avgTemperature}°C</div>
                <div className="text-xs text-gray-500">average</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">Max: {summaryStats.maxTemperature}°C</div>
            {summaryStats.hotGPUs > 0 && (
              <div className="text-xs text-red-500">{summaryStats.hotGPUs} GPUs over 80°C</div>
            )}
          </div>
        </div>

        {/* GPU Utilization Gauge */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">GPU Utilization</h3>
          <div className="relative h-32">
            <Doughnut
              data={createGaugeData(
                summaryStats.avgGPUUtilization,
                100,
                getUtilizationColor(summaryStats.avgGPUUtilization)
              )}
              options={gaugeOptions}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{summaryStats.avgGPUUtilization}%</div>
                <div className="text-xs text-gray-500">average</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              {summaryStats.activeGPUs} / {summaryStats.totalGPUs} active
            </div>
            <div className="text-xs text-gray-500">
              {Math.round((summaryStats.activeGPUs / summaryStats.totalGPUs) * 100)}% GPUs in use
            </div>
          </div>
        </div>
      </div>

      {/* Cluster Status Grid */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Cluster Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusterNames.map((clusterName) => {
            const nodes = clusterData[clusterName];
            const error = errors[clusterName];
            const clusterGPUs = nodes.flatMap(node => node.gpus);
            const clusterAvgUtil = clusterGPUs.length > 0 
              ? Math.round(clusterGPUs.reduce((sum, gpu) => sum + gpu.gpuUtilization, 0) / clusterGPUs.length)
              : 0;

            return (
              <div
                key={clusterName}
                className={`p-4 rounded-lg border-2 ${
                  error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{clusterName}</h4>
                  <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                </div>
                {error ? (
                  <p className="text-red-600 text-sm">Connection error</p>
                ) : (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Nodes:</span>
                      <span className="font-medium">{nodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GPUs:</span>
                      <span className="font-medium">{clusterGPUs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Util:</span>
                      <span className="font-medium">{clusterAvgUtil}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}