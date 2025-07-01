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

interface PowerChartProps {
  powerUsage: number;
  powerCap: number;
  gpuIndex: number;
}

// Global storage for GPU power history to persist across re-renders
const gpuPowerHistory = new Map<number, Array<{value: number, time: Date}>>();

export default function PowerChart({ powerUsage, powerCap, gpuIndex }: PowerChartProps) {
  const [history, setHistory] = useState<Array<{value: number, time: Date}>>(() => {
    return gpuPowerHistory.get(gpuIndex) || [];
  });
  const lastPowerRef = useRef<number>(powerUsage);

  useEffect(() => {
    // Only add new data point if power usage actually changed
    if (lastPowerRef.current !== powerUsage) {
      const now = new Date();
      const newHistory = [...history, { value: powerUsage, time: now }];
      const trimmedHistory = newHistory.slice(-60); // Keep last 60 points
      
      setHistory(trimmedHistory);
      gpuPowerHistory.set(gpuIndex, trimmedHistory);
      lastPowerRef.current = powerUsage;
    }
  }, [powerUsage, gpuIndex, history]);

  // Create time labels showing relative time
  const createTimeLabels = (dataPoints: Array<{value: number, time: Date}>) => {
    if (dataPoints.length === 0) return [];
    const latestTime = dataPoints[dataPoints.length - 1].time;
    return dataPoints.map((point) => {
      const diffSeconds = Math.floor((latestTime.getTime() - point.time.getTime()) / 1000);
      return diffSeconds === 0 ? 'now' : `-${diffSeconds}s`;
    });
  };

  const data = {
    labels: createTimeLabels(history),
    datasets: [
      {
        label: 'Power Usage',
        data: history.map(point => point.value),
        fill: true,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 1,
        pointHoverRadius: 4,
      },
    ],
  };

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300, // Short, smooth animation
      easing: 'easeOutCubic' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y}W`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: powerCap,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value: any) => `${value}W`,
          stepSize: Math.ceil(powerCap / 4),
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
        },
      },
    },
  }), [powerCap]);

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-gray-700">Power Usage History</span>
        <span className="text-sm text-gray-600">{powerUsage}W / {powerCap}W</span>
      </div>
      <div className="h-20">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}