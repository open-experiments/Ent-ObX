interface MetricDataPoint {
  temperature: number;
  fanSpeed: number;
  powerUsage: number;
  gpuUtilization: number;
  time: Date;
}

interface StoredGPUData {
  gpuIndex: number;
  clusterName: string;
  nodeName: string;
  data: MetricDataPoint[];
  lastUpdated: number;
  ttl: number; // Time to live in milliseconds
}

class MetricsStorage {
  private readonly STORAGE_KEY = 'gpu-console-metrics';
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds
  private readonly MAX_DATA_POINTS = 50; // Maximum data points per GPU
  
  constructor() {
    // Clean up expired data on initialization
    this.cleanup();
  }

  /**
   * Generate a unique key for a GPU
   */
  private getGPUKey(clusterName: string, nodeName: string, gpuIndex: number): string {
    return `${clusterName}:${nodeName}:${gpuIndex}`;
  }

  /**
   * Get all stored metrics data
   */
  private getAllData(): Record<string, StoredGPUData> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return {};
      
      const data = JSON.parse(stored);
      
      // Convert stored dates back to Date objects
      Object.values(data).forEach((gpuData: any) => {
        if (gpuData.data) {
          gpuData.data.forEach((point: any) => {
            point.time = new Date(point.time);
          });
        }
      });
      
      return data;
    } catch (error) {
      console.error('Error reading metrics from storage:', error);
      return {};
    }
  }

  /**
   * Save all metrics data to storage
   */
  private saveAllData(data: Record<string, StoredGPUData>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving metrics to storage:', error);
      // If storage is full, try cleaning up and retrying
      this.cleanup();
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      } catch (retryError) {
        console.error('Failed to save metrics even after cleanup:', retryError);
      }
    }
  }

  /**
   * Get metrics data for a specific GPU
   */
  getGPUData(clusterName: string, nodeName: string, gpuIndex: number): MetricDataPoint[] {
    const key = this.getGPUKey(clusterName, nodeName, gpuIndex);
    const allData = this.getAllData();
    const gpuData = allData[key];
    
    if (!gpuData) return [];
    
    // Check if data has expired
    const now = Date.now();
    if (now - gpuData.lastUpdated > gpuData.ttl) {
      // Data has expired, remove it
      delete allData[key];
      this.saveAllData(allData);
      return [];
    }
    
    return gpuData.data || [];
  }

  /**
   * Add a new data point for a GPU
   */
  addDataPoint(
    clusterName: string, 
    nodeName: string, 
    gpuIndex: number, 
    dataPoint: Omit<MetricDataPoint, 'time'>,
    customTTL?: number
  ): MetricDataPoint[] {
    const key = this.getGPUKey(clusterName, nodeName, gpuIndex);
    const allData = this.getAllData();
    
    const newDataPoint: MetricDataPoint = {
      ...dataPoint,
      time: new Date()
    };
    
    // Get existing data or create new entry
    let gpuData = allData[key];
    if (!gpuData) {
      gpuData = {
        gpuIndex,
        clusterName,
        nodeName,
        data: [],
        lastUpdated: Date.now(),
        ttl: customTTL || this.DEFAULT_TTL
      };
    }
    
    // Add new data point and limit to MAX_DATA_POINTS
    gpuData.data.push(newDataPoint);
    gpuData.data = gpuData.data.slice(-this.MAX_DATA_POINTS);
    gpuData.lastUpdated = Date.now();
    
    // Save back to storage
    allData[key] = gpuData;
    this.saveAllData(allData);
    
    return gpuData.data;
  }

  /**
   * Clean up expired data entries
   */
  cleanup(): void {
    const allData = this.getAllData();
    const now = Date.now();
    let hasChanges = false;
    
    Object.keys(allData).forEach(key => {
      const gpuData = allData[key];
      if (now - gpuData.lastUpdated > gpuData.ttl) {
        delete allData[key];
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      this.saveAllData(allData);
      console.log('🧹 Cleaned up expired GPU metrics data');
    }
  }

  /**
   * Clear all stored metrics data
   */
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ Cleared all GPU metrics data');
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    totalGPUs: number;
    totalDataPoints: number;
    storageSize: number;
    oldestData: Date | null;
    newestData: Date | null;
  } {
    const allData = this.getAllData();
    const gpus = Object.values(allData);
    
    let totalDataPoints = 0;
    let oldestTime: number | null = null;
    let newestTime: number | null = null;
    
    gpus.forEach(gpu => {
      totalDataPoints += gpu.data.length;
      gpu.data.forEach(point => {
        const time = point.time.getTime();
        if (oldestTime === null || time < oldestTime) oldestTime = time;
        if (newestTime === null || time > newestTime) newestTime = time;
      });
    });
    
    const storageSize = new Blob([JSON.stringify(allData)]).size;
    
    return {
      totalGPUs: gpus.length,
      totalDataPoints,
      storageSize,
      oldestData: oldestTime ? new Date(oldestTime) : null,
      newestData: newestTime ? new Date(newestTime) : null
    };
  }

  /**
   * Set custom TTL for future data points
   */
  setDefaultTTL(ttlMinutes: number): void {
    (this as any).DEFAULT_TTL = ttlMinutes * 60 * 1000;
  }

  /**
   * Get data for all GPUs in a cluster (useful for debugging)
   */
  getClusterData(clusterName: string): Record<string, MetricDataPoint[]> {
    const allData = this.getAllData();
    const clusterData: Record<string, MetricDataPoint[]> = {};
    
    Object.entries(allData).forEach(([key, gpuData]) => {
      if (gpuData.clusterName === clusterName) {
        clusterData[key] = gpuData.data;
      }
    });
    
    return clusterData;
  }
}

// Export a singleton instance
export const metricsStorage = new MetricsStorage();

// Export the interface for type checking
export type { MetricDataPoint };