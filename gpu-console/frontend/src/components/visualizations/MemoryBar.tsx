import { useMemo } from 'react';

interface MemoryBarProps {
  memoryUsed: number;
  memoryTotal: number;
}

export default function MemoryBar({ memoryUsed, memoryTotal }: MemoryBarProps) {
  const percentage = useMemo(() => (memoryUsed / memoryTotal) * 100, [memoryUsed, memoryTotal]);
  
  const barColor = useMemo(() => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [percentage]);

  const formattedMemoryUsed = useMemo(() => memoryUsed.toLocaleString(), [memoryUsed]);
  const formattedMemoryTotal = useMemo(() => memoryTotal.toLocaleString(), [memoryTotal]);
  const formattedPercentage = useMemo(() => percentage.toFixed(1), [percentage]);
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">Memory Usage</span>
        <span className="text-gray-600 transition-all duration-300">
          {formattedMemoryUsed} / {formattedMemoryTotal} MiB
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        >
          <div className="h-full flex items-center justify-end pr-2">
            <span className="text-xs text-white font-medium transition-all duration-300">
              {formattedPercentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}