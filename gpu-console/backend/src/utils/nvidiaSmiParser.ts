import { GPUInfo, GPUProcess } from '../models/types';

export function parseNvidiaSMI(output: string): {
  gpus: GPUInfo[];
  driverVersion: string;
  cudaVersion: string;
} {
  const lines = output.split('\n');
  const gpus: GPUInfo[] = [];
  let driverVersion = '';
  let cudaVersion = '';
  
  let currentGPU: Partial<GPUInfo> | null = null;
  let inProcessSection = false;
  const processes: GPUProcess[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Parse driver and CUDA version
    if (line.includes('Driver Version:')) {
      const driverMatch = line.match(/Driver Version:\s*(\S+)/);
      const cudaMatch = line.match(/CUDA Version:\s*(\S+)/);
      if (driverMatch) driverVersion = driverMatch[1];
      if (cudaMatch) cudaVersion = cudaMatch[1];
    }

    // Parse GPU info line - look for lines starting with GPU index
    if (line.match(/^\|\s*\d+\s+/)) {
      // Parse GPU index and name
      const gpuMatch = line.match(/^\|\s*(\d+)\s+(.+?)\s+(On|Off)\s+\|\s+(\S+)\s+(On|Off)\s+\|/);
      if (gpuMatch) {
        const [, index, name, persistence, busId, display] = gpuMatch;
        currentGPU = {
          index: parseInt(index),
          name: name.trim().replace(/\s+/g, ' '),
          persistenceMode: persistence === 'On',
          busId: busId,
          processes: []
        };
        
        // Look for the next line with fan, temp, power info
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const perfMatch = nextLine.match(/^\|\s*(\d+)%\s+(\d+)C\s+(\S+)\s+(\d+)W\s*\/\s*(\d+)W\s+\|\s+(\d+)MiB\s*\/\s*(\d+)MiB\s+\|\s+(\d+)%\s+(\S+)\s+\|/);
          if (perfMatch) {
            const [, fanSpeed, temperature, perfState, powerUsage, powerCap, memoryUsed, memoryTotal, gpuUtil, computeMode] = perfMatch;
            currentGPU.fanSpeed = parseInt(fanSpeed);
            currentGPU.temperature = parseInt(temperature);
            currentGPU.performanceState = perfState;
            currentGPU.powerUsage = parseInt(powerUsage);
            currentGPU.powerCap = parseInt(powerCap);
            currentGPU.memoryUsed = parseInt(memoryUsed);
            currentGPU.memoryTotal = parseInt(memoryTotal);
            currentGPU.gpuUtilization = parseInt(gpuUtil);
            currentGPU.computeMode = computeMode;
            
            if (currentGPU.index !== undefined) {
              gpus.push(currentGPU as GPUInfo);
            }
            currentGPU = null;
          }
        }
      }
    }

    // Detect processes section
    if (line.includes('Processes:')) {
      inProcessSection = true;
      continue;
    }

    // Parse process lines
    if (inProcessSection && line.match(/^\|\s*\d+\s+/)) {
      const processMatch = line.match(/^\|\s*(\d+)\s+\S+\s+\S+\s+(\d+)\s+(\S+)\s+(.+?)\s+(\d+)MiB\s+\|/);
      if (processMatch) {
        const [, gpuIndex, pid, type, processName, memUsage] = processMatch;
        processes.push({
          gpuIndex: parseInt(gpuIndex),
          pid: parseInt(pid),
          type: type,
          processName: processName.trim(),
          gpuMemoryUsage: parseInt(memUsage)
        } as any);
      }
    }
  }

  // Assign processes to GPUs based on GPU index
  gpus.forEach((gpu) => {
    gpu.processes = processes.filter((p: any) => p.gpuIndex === gpu.index).map((p: any) => ({
      pid: p.pid,
      type: p.type,
      processName: p.processName,
      gpuMemoryUsage: p.gpuMemoryUsage
    }));
  });

  return { gpus, driverVersion, cudaVersion };
}