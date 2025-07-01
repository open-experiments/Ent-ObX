import { useState, useEffect, useRef } from 'react';
import { ClusterGPUData, ClusterConfig } from '../types';
import { api } from '../services/api';

export function useMultiClusterGPUData(clusters: ClusterConfig[]) {
  const [clusterData, setClusterData] = useState<Record<string, ClusterGPUData[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (clusters.length === 0) {
      setClusterData({});
      setIsLoading(false);
      setErrors({});
      return;
    }

    const fetchAllClustersData = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 Fetching GPU data for all clusters:', clusters.map(c => c.name));
        
        // Fetch data from all clusters in parallel
        const promises = clusters.map(async (cluster) => {
          try {
            const response = await api.getGPUInfo(cluster.name);
            return { clusterName: cluster.name, data: response.data, error: null };
          } catch (err) {
            console.error(`❌ Failed to fetch GPU data for ${cluster.name}:`, err);
            return { clusterName: cluster.name, data: [], error: `Failed to fetch data: ${err}` };
          }
        });

        const results = await Promise.all(promises);
        
        // Update state with all results
        const newClusterData: Record<string, ClusterGPUData[]> = {};
        const newErrors: Record<string, string> = {};
        
        results.forEach(result => {
          if (result.error) {
            newErrors[result.clusterName] = result.error;
            newClusterData[result.clusterName] = [];
          } else {
            newClusterData[result.clusterName] = result.data;
          }
        });

        setClusterData(newClusterData);
        setErrors(newErrors);
        setIsLoading(false);
        
        console.log('📊 Received GPU data for all clusters:', Object.keys(newClusterData));
      } catch (err) {
        console.error('❌ Failed to fetch multi-cluster GPU data:', err);
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchAllClustersData();

    // Set up polling every 5 seconds
    intervalRef.current = setInterval(fetchAllClustersData, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [clusters]);

  return { clusterData, isLoading, errors };
}