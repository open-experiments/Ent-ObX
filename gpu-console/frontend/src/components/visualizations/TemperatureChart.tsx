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

interface TemperatureChartProps {
  temperature: number;
  gpuIndex: number;
}

// Global storage for temperature history to persist across re-renders
const gpuTemperatureHistory = new Map<number, Array<{value: number, time: Date}>>();

export default function TemperatureChart({ temperature, gpuIndex }: TemperatureChartProps) {
  const [history, setHistory] = useState<Array<{value: number, time: Date}>>(() => {
    return gpuTemperatureHistory.get(gpuIndex) || [];
  });
  const chartRef = useRef<ChartJS<'line'>>(null);

  useEffect(() => {
    const now = new Date();
    const newDataPoint = { value: temperature, time: now };
    
    setHistory(prevHistory => {
      // Keep last 20 data points (about 100 seconds at 5-second intervals)
      const updatedHistory = [...prevHistory, newDataPoint].slice(-20);
      
      // Store in global map
      gpuTemperatureHistory.set(gpuIndex, updatedHistory);
      
      return updatedHistory;
    });
  }, [temperature, gpuIndex]);

  const createTimeLabels = (dataPoints: Array<{value: number, time: Date}>) => {
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
    const temperatures = history.map(point => point.value);

    return {
      labels,
      datasets: [
        {
          label: 'Temperature',
          data: temperatures,
          borderColor: '#dc2626', // red
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 4,
          pointBackgroundColor: '#dc2626',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
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
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#dc2626',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `Temperature: ${context.parsed.y}°C`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: Math.max(0, Math.min(...history.map(h => h.value)) - 5),
        max: Math.max(100, Math.max(...history.map(h => h.value)) + 5),
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 10,
          },
          callback: (value: any) => `${value}°C`,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 6,
          callback: function(_value: any, index: number) {
            const labels = createTimeLabels(history);
            if (index % Math.ceil(labels.length / 5) === 0) {
              return labels[index];
            }
            return '';
          },
          color: '#6b7280',
          font: {
            size: 9,
          },
        },
      },
    },
    elements: {
      point: {
        hoverRadius: 6,
      },
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
  }), [history]);

  if (history.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Temperature History</h4>
        <div className="h-24 bg-gray-50 rounded flex items-center justify-center">
          <span className="text-gray-400 text-sm">Collecting data...</span>
        </div>
      </div>
    );
  }

  const currentTemp = history[history.length - 1]?.value || 0;
  const previousTemp = history[history.length - 2]?.value || currentTemp;
  const tempChange = currentTemp - previousTemp;
  const tempTrend = tempChange > 1 ? 'rising' : tempChange < -1 ? 'falling' : 'stable';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">Temperature History</h4>
        <div className="flex items-center space-x-2 text-xs">
          <span className={`font-medium ${
            currentTemp > 80 ? 'text-red-600' : 
            currentTemp > 60 ? 'text-orange-600' : 'text-green-600'
          }`}>
            {currentTemp}°C
          </span>
          {tempTrend !== 'stable' && (
            <span className={`text-xs ${
              tempTrend === 'rising' ? 'text-red-500' : 'text-blue-500'
            }`}>
              {tempTrend === 'rising' ? '↗' : '↘'}
            </span>
          )}
        </div>
      </div>
      <div className="h-24 bg-white rounded border">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      {history.length > 1 && (
        <div className="mt-1 text-xs text-gray-500 text-center">
          Range: {Math.min(...history.map(h => h.value))}°C - {Math.max(...history.map(h => h.value))}°C
          {tempChange !== 0 && (
            <span className={`ml-2 ${tempChange > 0 ? 'text-red-500' : 'text-blue-500'}`}>
              ({tempChange > 0 ? '+' : ''}{tempChange.toFixed(1)}°C)
            </span>
          )}
        </div>
      )}
    </div>
  );
}