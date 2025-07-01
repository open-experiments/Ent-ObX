import * as k8s from '@kubernetes/client-node';
import { PassThrough } from 'stream';
import { ClusterConfig, ClusterGPUData } from '../models/types';
import { parseNvidiaSMI } from '../utils/nvidiaSmiParser';

export class KubernetesService {
  private kubeconfigs: Map<string, k8s.KubeConfig> = new Map();

  loadKubeconfig(cluster: ClusterConfig): void {
    const kc = new k8s.KubeConfig();
    kc.loadFromFile(cluster.kubeconfigPath);
    this.kubeconfigs.set(cluster.name, kc);
  }

  async getGPUData(clusterName: string): Promise<ClusterGPUData[]> {
    const kc = this.kubeconfigs.get(clusterName);
    if (!kc) {
      throw new Error(`Cluster ${clusterName} not configured`);
    }

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    const exec = new k8s.Exec(kc);
    
    try {
      const namespace = 'nvidia-gpu-operator';
      const { body } = await k8sApi.listNamespacedPod(namespace);
      
      const driverPods = body.items.filter(pod => 
        pod.metadata?.name?.includes('nvidia-driver-daemonset')
      );

      const results: ClusterGPUData[] = [];

      for (const pod of driverPods) {
        if (pod.metadata?.name && pod.spec?.nodeName) {
          try {
            const nvidiaSmiOutput = await this.execInPod(
              exec, 
              namespace, 
              pod.metadata.name, 
              ['nvidia-smi']
            );
            
            const parsedData = parseNvidiaSMI(nvidiaSmiOutput);
            
            results.push({
              clusterName,
              timestamp: new Date(),
              nodeName: pod.spec.nodeName,
              ...parsedData
            });
          } catch (error) {
            console.error(`Failed to get GPU data from pod ${pod.metadata.name}:`, error);
          }
        }
      }

      return results;
    } catch (error) {
      console.error(`Failed to get GPU data for cluster ${clusterName}:`, error);
      throw error;
    }
  }

  private execInPod(
    exec: k8s.Exec, 
    namespace: string, 
    podName: string, 
    command: string[]
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';
      
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      
      exec.exec(
        namespace,
        podName,
        'nvidia-driver-ctr',
        command,
        stdout,
        stderr,
        null,
        false,
        (status: k8s.V1Status) => {
          if (status.status === 'Success') {
            resolve(output);
          } else {
            reject(new Error(`Exec failed: ${status.message || error}`));
          }
        }
      );
      
      stdout.on('data', (chunk: Buffer | string) => {
        output += chunk.toString();
      });
      
      stderr.on('data', (chunk: Buffer | string) => {
        error += chunk.toString();
      });
    });
  }
}