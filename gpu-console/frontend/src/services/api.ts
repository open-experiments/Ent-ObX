import axios from 'axios';
import { ClusterConfig, ClusterGPUData } from '../types';

const apiClient = axios.create({
  baseURL: '/api',
});

export const api = {
  getClusters: () => apiClient.get<ClusterConfig[]>('/clusters'),
  addCluster: (cluster: ClusterConfig) => apiClient.post('/clusters', cluster),
  removeCluster: (name: string) => apiClient.delete(`/clusters/${name}`),
  getGPUInfo: (clusterName: string) => apiClient.get<ClusterGPUData[]>(`/clusters/${clusterName}/gpus`),
};