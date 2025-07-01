export interface ClusterConfig {
  name: string;
  kubeconfigPath: string;
  namespace?: string;
}

export interface GPUInfo {
  index: number;
  name: string;
  uuid?: string;
  busId: string;
  persistenceMode: boolean;
  fanSpeed: number;
  temperature: number;
  performanceState: string;
  powerUsage: number;
  powerCap: number;
  memoryUsed: number;
  memoryTotal: number;
  gpuUtilization: number;
  computeMode: string;
  processes: GPUProcess[];
}

export interface GPUProcess {
  pid: number;
  type: string;
  processName: string;
  gpuMemoryUsage: number;
}

export interface ClusterGPUData {
  clusterName: string;
  timestamp: Date;
  nodeName: string;
  gpus: GPUInfo[];
  driverVersion: string;
  cudaVersion: string;
}