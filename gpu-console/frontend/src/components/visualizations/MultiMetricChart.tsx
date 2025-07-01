import { useEffect, useState, useRef, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { metricsStorage, MetricDataPoint } from '../../utils/metricsStorage';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MultiMetricChartProps {
  temperature: number;
  fanSpeed: number;
  powerUsage: number;
  powerCap: number;
  gpuUtilization: number;
  gpuIndex: number;
  clusterName: string;
  nodeName: string;
}


export default function MultiMetricChart({ 
  temperature, 
  fanSpeed, 
  powerUsage, 
  powerCap, 
  gpuUtilization, 
  gpuIndex,
  clusterName,
  nodeName
}: MultiMetricChartProps) {
  const [history, setHistory] = useState<MetricDataPoint[]>(() => {
    // Load existing data from persistent storage
    return metricsStorage.getGPUData(clusterName, nodeName, gpuIndex);
  });
  const chartRef = useRef<ChartJS<'line'>>(null);

  useEffect(() => {
    // Add new data point to persistent storage
    const updatedHistory = metricsStorage.addDataPoint(
      clusterName,
      nodeName,
      gpuIndex,
      {
        temperature,
        fanSpeed,
        powerUsage,
        gpuUtilization
      }
    );
    
    setHistory(updatedHistory);
  }, [temperature, fanSpeed, powerUsage, gpuUtilization, gpuIndex, clusterName, nodeName]);

  const createTimeLabels = (dataPoints: MetricDataPoint[]) => {
    return dataPoints.map(point => {
      const time = point.time;
      return time.toLocaleTimeString('en-US', { 
        hour12: false, 
        minute: '2-digit', 
        second: '2-digit' 
      });
    });
  };

  const chartData = useMemo(() => {
    const labels = createTimeLabels(history);

    return {
      labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: history.map(point => point.temperature),
          borderColor: '#dc2626', // red
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 1,
          pointHoverRadius: 5,
          pointBackgroundColor: '#dc2626',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          yAxisID: 'temperature',
        },
        {
          label: 'Fan Speed (%)',
          data: history.map(point => point.fanSpeed),
          borderColor: '#2563eb', // blue
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 1,
          pointHoverRadius: 5,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          yAxisID: 'percentage',
        },
        {
          label: 'Power Usage (W)',
          data: history.map(point => point.powerUsage),
          borderColor: '#16a34a', // green
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 1,
          pointHoverRadius: 5,
          pointBackgroundColor: '#16a34a',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          yAxisID: 'power',
        },
        {
          label: 'GPU Utilization (%)',
          data: history.map(point => point.gpuUtilization),
          borderColor: '#7c3aed', // purple
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 1,
          pointHoverRadius: 5,
          pointBackgroundColor: '#7c3aed',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          yAxisID: 'percentage',
        },
      ],
    };
  }, [history]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
          font: {
            size: 10,
          },
          padding: 12,
          boxWidth: 15,
          boxHeight: 2,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#4f46e5',
        borderWidth: 1,
        titleFont: {
          size: 12,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 11,
        },
        padding: 12,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            const dataIndex = context[0].dataIndex;
            const timePoint = history[dataIndex];
            if (timePoint) {
              return `Time: ${timePoint.time.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit',
                minute: '2-digit', 
                second: '2-digit' 
              })}`;
            }
            return '';
          },
          beforeBody: () => {
            return '━━━━━━━━━━━━━━━━━━━━━━━━━━━';
          },
          label: (context: any) => {
            const dataIndex = context.dataIndex;
            const dataPoint = history[dataIndex];
            if (!dataPoint) return '';

            const lines = [
              `🌡️  Temperature: ${dataPoint.temperature}°C`,
              `🌀  Fan Speed: ${dataPoint.fanSpeed}%`,
              `⚡  Power Usage: ${dataPoint.powerUsage}W`,
              `🎯  GPU Utilization: ${dataPoint.gpuUtilization}%`,
            ];

            // Add status indicators
            const tempStatus = dataPoint.temperature > 80 ? '🔥 HOT' : 
                             dataPoint.temperature > 60 ? '⚠️  WARM' : '✅ COOL';
            const fanStatus = dataPoint.fanSpeed > 70 ? '💨 HIGH' : 
                             dataPoint.fanSpeed > 40 ? '🌪️  MED' : '😴 LOW';
            const powerStatus = dataPoint.powerUsage > (powerCap * 0.8) ? '🔋 HIGH' : 
                               dataPoint.powerUsage > (powerCap * 0.5) ? '🔋 MED' : '🔋 LOW';
            const utilStatus = dataPoint.gpuUtilization > 80 ? '🚀 BUSY' : 
                              dataPoint.gpuUtilization > 20 ? '📊 ACTIVE' : '💤 IDLE';

            return [
              ...lines,
              '',
              `Status: ${tempStatus} | ${fanStatus} | ${powerStatus} | ${utilStatus}`
            ];
          },
          afterBody: () => {
            return '━━━━━━━━━━━━━━━━━━━━━━━━━━━';
          }
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          maxTicksLimit: 8,
          callback: function(_value: any, index: number) {
            const labels = createTimeLabels(history);
            if (index % Math.ceil(labels.length / 6) === 0) {
              return labels[index]?.substring(0, 5); // Show HH:MM only
            }
            return '';
          },
          color: '#6b7280',
          font: {
            size: 9,
          },
        },
      },
      temperature: {
        type: 'linear' as const,
        position: 'left' as const,
        min: Math.max(0, Math.min(...history.map(h => h.temperature)) - 5),
        max: Math.min(100, Math.max(...history.map(h => h.temperature)) + 10),
        grid: {
          color: 'rgba(220, 38, 38, 0.1)',
        },
        ticks: {
          color: '#dc2626',
          font: {
            size: 9,
          },
          callback: (value: any) => `${value}°C`,
        },
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: '#dc2626',
          font: {
            size: 10,
            weight: 'bold' as const,
          },
        },
      },
      percentage: {
        type: 'linear' as const,
        position: 'right' as const,
        min: 0,
        max: 100,
        grid: {
          display: false,
        },
        ticks: {
          color: '#2563eb',
          font: {
            size: 9,
          },
          callback: (value: any) => `${value}%`,
        },
        title: {
          display: true,
          text: 'Percentage (%)',
          color: '#2563eb',
          font: {
            size: 10,
            weight: 'bold' as const,
          },
        },
      },
      power: {
        type: 'linear' as const,
        position: 'left' as const,
        min: 0,
        max: Math.max(powerCap, Math.max(...history.map(h => h.powerUsage)) + 50),
        display: false, // Hidden, but used for scaling power data
      },
    },
    elements: {
      point: {
        hoverRadius: 6,
      },
    },
    animation: {
      duration: 500,
      easing: 'easeInOutQuart' as const,
    },
  }), [history, powerCap]);

  if (history.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">📊 Multi-Metric History</h4>
        <div className="h-40 bg-gray-50 rounded flex items-center justify-center">
          <span className="text-gray-400 text-sm">Collecting data...</span>
        </div>
      </div>
    );
  }

  const currentData = history[history.length - 1];
  const previousData = history[history.length - 2] || currentData;

  const getTrend = (current: number, previous: number, threshold = 1) => {
    const diff = current - previous;
    if (Math.abs(diff) < threshold) return '━';
    return diff > 0 ? '↗' : '↘';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">📊 Multi-Metric History</h4>
        <div className="flex items-center space-x-4 text-xs">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-red-500 rounded"></span>
            <span>{currentData.temperature}°C</span>
            <span className="text-red-500">{getTrend(currentData.temperature, previousData.temperature)}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-blue-500 rounded"></span>
            <span>{currentData.fanSpeed}%</span>
            <span className="text-blue-500">{getTrend(currentData.fanSpeed, previousData.fanSpeed, 2)}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-500 rounded"></span>
            <span>{currentData.powerUsage}W</span>
            <span className="text-green-500">{getTrend(currentData.powerUsage, previousData.powerUsage, 5)}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-purple-500 rounded"></span>
            <span>{currentData.gpuUtilization}%</span>
            <span className="text-purple-500">{getTrend(currentData.gpuUtilization, previousData.gpuUtilization, 2)}</span>
          </span>
        </div>
      </div>
      <div className="h-40 bg-white rounded border">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      {history.length > 1 && (
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
          <div className="text-center">
            <div className="font-medium text-red-600">Temp Range</div>
            <div>{Math.min(...history.map(h => h.temperature))}°C - {Math.max(...history.map(h => h.temperature))}°C</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-blue-600">Fan Range</div>
            <div>{Math.min(...history.map(h => h.fanSpeed))}% - {Math.max(...history.map(h => h.fanSpeed))}%</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-600">Power Range</div>
            <div>{Math.min(...history.map(h => h.powerUsage))}W - {Math.max(...history.map(h => h.powerUsage))}W</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-purple-600">GPU Range</div>
            <div>{Math.min(...history.map(h => h.gpuUtilization))}% - {Math.max(...history.map(h => h.gpuUtilization))}%</div>
          </div>
        </div>
      )}
    </div>
  );
}