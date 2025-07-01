import { useState, useEffect, useRef } from 'react';
import { ClusterGPUData } from '../types';
import { api } from '../services/api';

export function useGPUData(selectedCluster: string) {
  const [gpuData, setGpuData] = useState<ClusterGPUData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (!selectedCluster) {
      setGpuData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchGPUData = async () => {
      try {
        setError(null);
        setIsLoading(true);
        
        console.log(`🔍 Fetching GPU data for ${selectedCluster}`);
        const response = await api.getGPUInfo(selectedCluster);
        console.log(`📊 Received GPU data for ${selectedCluster}:`, response.data);
        setGpuData(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error(`❌ Failed to fetch GPU data for ${selectedCluster}:`, err);
        setError(`Failed to fetch GPU data: ${err}`);
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchGPUData();

    // Set up polling every 5 seconds
    intervalRef.current = setInterval(fetchGPUData, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [selectedCluster]);

  return { gpuData, isLoading, error };
}