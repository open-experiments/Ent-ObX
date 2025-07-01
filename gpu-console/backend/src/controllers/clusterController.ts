import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { ClusterConfig } from '../models/types';

export class ClusterController {
  private configPath = path.join(process.cwd(), '..', 'config', 'clusters.json');
  private clusters: ClusterConfig[] = [];

  constructor() {
    this.loadClusters().catch(console.error);
  }

  private async loadClusters() {
    try {
      console.log('Loading clusters from:', this.configPath);
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.clusters = JSON.parse(data);
      console.log('Loaded clusters:', this.clusters.length);
    } catch (error) {
      console.log('Error loading cluster config:', error);
      this.clusters = [];
    }
  }

  private async saveClusters() {
    await fs.mkdir(path.dirname(this.configPath), { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(this.clusters, null, 2));
  }

  getClusters = async (req: Request, res: Response) => {
    res.json(this.clusters);
  };

  addCluster = async (req: Request, res: Response) => {
    const cluster: ClusterConfig = req.body;
    
    // Validate kubeconfig exists
    try {
      await fs.access(cluster.kubeconfigPath);
    } catch (error) {
      return res.status(400).json({ error: 'Kubeconfig file not found' });
    }

    // Check if cluster already exists
    if (this.clusters.find(c => c.name === cluster.name)) {
      return res.status(400).json({ error: 'Cluster already exists' });
    }

    this.clusters.push(cluster);
    await this.saveClusters();
    res.json({ message: 'Cluster added successfully' });
  };

  removeCluster = async (req: Request, res: Response) => {
    const { name } = req.params;
    this.clusters = this.clusters.filter(c => c.name !== name);
    await this.saveClusters();
    res.json({ message: 'Cluster removed successfully' });
  };
}