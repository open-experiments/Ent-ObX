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

interface UtilizationChartProps {
  utilization: number;
  gpuIndex: number;
}

// Global storage for GPU utilization history to persist across re-renders
const gpuUtilizationHistory = new Map<number, Array<{value: number, time: Date}>>();

export default function UtilizationChart({ utilization, gpuIndex }: UtilizationChartProps) {
  const [history, setHistory] = useState<Array<{value: number, time: Date}>>(() => {
    return gpuUtilizationHistory.get(gpuIndex) || [];
  });
  const lastUtilizationRef = useRef<number>(utilization);

  useEffect(() => {
    // Only add new data point if utilization actually changed
    if (lastUtilizationRef.current !== utilization) {
      const now = new Date();
      const newHistory = [...history, { value: utilization, time: now }];
      const trimmedHistory = newHistory.slice(-60); // Keep last 60 points
      
      setHistory(trimmedHistory);
      gpuUtilizationHistory.set(gpuIndex, trimmedHistory);
      lastUtilizationRef.current = utilization;
    }
  }, [utilization, gpuIndex, history]);

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
        label: 'GPU Utilization',
        data: history.map(point => point.value),
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgb(99, 102, 241)',
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
          label: (context: any) => `${context.parsed.y}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value: any) => `${value}%`,
          stepSize: 25,
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
  }), []);

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-gray-700">GPU Utilization</span>
        <span className="text-2xl font-bold text-indigo-600">{utilization}%</span>
      </div>
      <div className="h-24">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}