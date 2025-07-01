import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ClusterController } from './controllers/clusterController';
import { GPUController } from './controllers/gpuController';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://127.0.0.1:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const clusterController = new ClusterController();
const gpuController = new GPUController(io);

app.get('/api/clusters', clusterController.getClusters);
app.post('/api/clusters', clusterController.addCluster);
app.delete('/api/clusters/:name', clusterController.removeCluster);
app.get('/api/clusters/:name/gpus', gpuController.getGPUInfo);

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  socket.on('subscribe-gpu-updates', (clusterName: string) => {
    console.log(`📡 Subscribing ${socket.id} to cluster: ${clusterName}`);
    gpuController.subscribeToUpdates(socket, clusterName);
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} - Reason: ${reason}`);
  });

  socket.on('error', (error) => {
    console.error(`🚫 Socket error for ${socket.id}:`, error);
  });
});

const PORT = Number(process.env.PORT) || 3001;
httpServer.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});