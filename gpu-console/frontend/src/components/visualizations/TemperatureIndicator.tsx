import { useEffect, useState } from 'react';

interface TemperatureIndicatorProps {
  temperature: number;
  fanSpeed: number;
  gpuIndex: number;
}

export default function TemperatureIndicator({ temperature, fanSpeed }: TemperatureIndicatorProps) {
  const [tempHistory, setTempHistory] = useState<number[]>([]);
  const [fanHistory, setFanHistory] = useState<number[]>([]);
  const [tempTrend, setTempTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [fanTrend, setFanTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    setTempHistory(prev => {
      const newHistory = [...prev, temperature];
      const history = newHistory.slice(-5); // Keep last 5 readings
      
      // Calculate trend
      if (history.length >= 3) {
        const recent = history.slice(-3);
        const avg1 = recent[0];
        const avg2 = (recent[1] + recent[2]) / 2;
        
        if (avg2 > avg1 + 1) {
          setTempTrend('up');
        } else if (avg2 < avg1 - 1) {
          setTempTrend('down');
        } else {
          setTempTrend('stable');
        }
      }
      
      return history;
    });
  }, [temperature]);

  useEffect(() => {
    setFanHistory(prev => {
      const newHistory = [...prev, fanSpeed];
      const history = newHistory.slice(-5); // Keep last 5 readings
      
      // Calculate fan trend
      if (history.length >= 3) {
        const recent = history.slice(-3);
        const avg1 = recent[0];
        const avg2 = (recent[1] + recent[2]) / 2;
        
        if (avg2 > avg1 + 2) { // 2% threshold for fan speed
          setFanTrend('up');
        } else if (avg2 < avg1 - 2) {
          setFanTrend('down');
        } else {
          setFanTrend('stable');
        }
      }
      
      return history;
    });
  }, [fanSpeed]);

  const getTemperatureColor = (temp: number, trend: string) => {
    // High priority: Over 60°C going up = red
    if (temp > 60 && trend === 'up') return 'text-red-600 bg-red-100 border-red-300';
    
    // Medium priority: Over 60°C stable = orange
    if (temp > 60) return 'text-orange-600 bg-orange-100 border-orange-300';
    
    // Low priority: Under 60°C going down = green
    if (temp <= 60 && trend === 'down') return 'text-green-600 bg-green-100 border-green-300';
    
    // Default: Under 60°C = blue
    return 'text-blue-600 bg-blue-100 border-blue-300';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getFanColor = (fanSpeed: number, trend: string) => {
    // High priority: Over 50% going up = red
    if (fanSpeed > 50 && trend === 'up') return 'text-red-600 bg-red-100 border-red-300';
    
    // Medium priority: Over 50% stable = orange
    if (fanSpeed > 50) return 'text-orange-600 bg-orange-100 border-orange-300';
    
    // Low priority: Under 50% going down = green
    if (fanSpeed <= 50 && trend === 'down') return 'text-green-600 bg-green-100 border-green-300';
    
    // Default: Under 50% = blue
    return 'text-blue-600 bg-blue-100 border-blue-300';
  };

  const getTrendColor = (trend: string, temp: number) => {
    if (temp > 60 && trend === 'up') return 'text-red-500';
    if (trend === 'down' && temp <= 60) return 'text-green-500';
    if (trend === 'up') return 'text-orange-500';
    if (trend === 'down') return 'text-blue-500';
    return 'text-gray-500';
  };

  const getFanTrendColor = (trend: string, fanSpeed: number) => {
    if (fanSpeed > 50 && trend === 'up') return 'text-red-500';
    if (trend === 'down' && fanSpeed <= 50) return 'text-green-500';
    if (trend === 'up') return 'text-orange-500';
    if (trend === 'down') return 'text-blue-500';
    return 'text-gray-500';
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Temperature & Fan</h4>
      <div className="space-y-2">
        <div className={`rounded-lg p-2 border-2 transition-all duration-300 ${getTemperatureColor(temperature, tempTrend)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v7.586L7.707 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V3a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-xs">Temp</span>
              <div className={`transition-colors duration-300 ${getTrendColor(tempTrend, temperature)}`}>
                {getTrendIcon(tempTrend)}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-lg font-bold">{temperature}°C</span>
              {temperature > 60 && (
                <span className="text-xs bg-white bg-opacity-50 px-1 rounded">
                  HOT
                </span>
              )}
            </div>
          </div>
          {tempHistory.length > 1 && (
            <div className="mt-1 text-xs opacity-75">
              Trend: {tempHistory[tempHistory.length - 2]}°C → {temperature}°C
            </div>
          )}
        </div>
        
        <div className={`rounded-lg p-2 border-2 transition-all duration-300 ${getFanColor(fanSpeed, fanTrend)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3a7 7 0 100 14 7 7 0 000-14zM10 1a9 9 0 110 18 9 9 0 010-18z"/>
                <path d="M10 5v5l3.536 3.536"/>
              </svg>
              <span className="font-medium text-xs">Fan</span>
              <div className={`transition-colors duration-300 ${getFanTrendColor(fanTrend, fanSpeed)}`}>
                {getTrendIcon(fanTrend)}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-lg font-bold">{fanSpeed}%</span>
              {fanSpeed > 50 && (
                <span className="text-xs bg-white bg-opacity-50 px-1 rounded">
                  HIGH
                </span>
              )}
            </div>
          </div>
          {fanHistory.length > 1 && (
            <div className="mt-1 text-xs opacity-75">
              Trend: {fanHistory[fanHistory.length - 2]}% → {fanSpeed}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}