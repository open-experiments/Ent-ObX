import { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

interface PowerGaugeProps {
  powerUsage: number;
  powerCap: number;
}

export default function PowerGauge({ powerUsage, powerCap }: PowerGaugeProps) {
  const percentage = (powerUsage / powerCap) * 100;
  
  const data = useMemo(() => ({
    datasets: [
      {
        data: [powerUsage, powerCap - powerUsage],
        backgroundColor: [
          percentage > 80 ? '#EF4444' : percentage > 60 ? '#F59E0B' : '#10B981',
          '#E5E7EB',
        ],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      },
    ],
  }), [powerUsage, powerCap, percentage]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750, // Smooth but not too slow
      easing: 'easeOutCubic' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    cutout: '75%',
  }), []);

  return (
    <div className="relative">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Power Usage</h4>
      <div className="h-32 relative">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex items-center justify-center mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold transition-all duration-300">{powerUsage}W</div>
            <div className="text-xs text-gray-500">of {powerCap}W</div>
          </div>
        </div>
      </div>
    </div>
  );
}