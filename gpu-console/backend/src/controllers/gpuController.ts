import { Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import { KubernetesService } from '../services/kubernetesService';
import { ClusterConfig } from '../models/types';
import fs from 'fs/promises';
import path from 'path';

export class GPUController {
  private kubernetesService: KubernetesService;
  private io: Server;
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: Server) {
    this.kubernetesService = new KubernetesService();
    this.io = io;
    this.initializeClusters();
  }

  private async initializeClusters() {
    try {
      const configPath = path.join(process.cwd(), '..', 'config', 'clusters.json');
      console.log('🔧 Loading clusters from:', configPath);
      const data = await fs.readFile(configPath, 'utf-8');
      const clusters: ClusterConfig[] = JSON.parse(data);
      
      clusters.forEach(cluster => {
        console.log(`🔑 Loading kubeconfig for cluster: ${cluster.name}`);
        this.kubernetesService.loadKubeconfig(cluster);
      });
      console.log(`✅ Initialized ${clusters.length} clusters`);
    } catch (error) {
      console.error('❌ Failed to initialize clusters:', error);
    }
  }

  getGPUInfo = async (req: Request, res: Response) => {
    const { name } = req.params;
    
    try {
      const gpuData = await this.kubernetesService.getGPUData(name);
      res.json(gpuData);
    } catch (error) {
      res.status(500).json({ error: `Failed to get GPU data: ${error}` });
    }
  };

  subscribeToUpdates = (socket: Socket, clusterName: string) => {
    const roomName = `cluster-${clusterName}`;
    console.log(`📡 Socket ${socket.id} joining room: ${roomName}`);
    socket.join(roomName);

    // Clear any existing interval for this cluster
    const existingInterval = this.updateIntervals.get(clusterName);
    if (existingInterval) {
      console.log(`🔄 Clearing existing interval for ${clusterName}`);
      clearInterval(existingInterval);
    }

    // Send initial data immediately
    console.log(`📊 Sending initial GPU data for ${clusterName}`);
    this.sendGPUUpdate(clusterName);

    // Set up periodic updates
    const interval = setInterval(() => {
      console.log(`🔄 Sending periodic GPU update for ${clusterName}`);
      this.sendGPUUpdate(clusterName);
    }, 5000); // Update every 5 seconds

    this.updateIntervals.set(clusterName, interval);

    socket.on('disconnect', () => {
      console.log(`❌ Socket ${socket.id} disconnected from ${roomName}`);
      socket.leave(roomName);
      // Don't clear interval here as other clients might still be subscribed
    });
  };

  private async sendGPUUpdate(clusterName: string) {
    try {
      console.log(`🔍 Fetching GPU data for cluster: ${clusterName}`);
      const gpuData = await this.kubernetesService.getGPUData(clusterName);
      console.log(`📤 Emitting GPU data for ${clusterName} to room cluster-${clusterName}`);
      console.log(`📊 GPU data:`, JSON.stringify(gpuData, null, 2));
      this.io.to(`cluster-${clusterName}`).emit('gpu-update', gpuData);
    } catch (error) {
      console.error(`❌ Error fetching GPU data for ${clusterName}:`, error);
      this.io.to(`cluster-${clusterName}`).emit('gpu-error', {
        error: `Failed to get GPU data: ${error}`
      });
    }
  }
}