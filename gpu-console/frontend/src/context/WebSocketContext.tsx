import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { ClusterGPUData } from '../types';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  gpuData: Record<string, ClusterGPUData[]>;
  subscribeToCluster: (clusterName: string) => void;
  unsubscribeFromCluster: (clusterName: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gpuData, setGpuData] = useState<Record<string, ClusterGPUData[]>>({});
  const socketRef = useRef<Socket | null>(null);
  const subscribedClustersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Prevent multiple socket connections
    if (socketRef.current) {
      console.log('⚠️ Socket already exists, reusing');
      setSocket(socketRef.current);
      setIsConnected(socketRef.current.connected);
      return;
    }

    console.log('🔌 Creating NEW WebSocket connection');
    
    const newSocket = io('http://127.0.0.1:3001', {
      transports: ['websocket'],
      upgrade: false,
      timeout: 30000,
      autoConnect: true,
      forceNew: false,
    });

    // Store the socket immediately to prevent duplicates
    socketRef.current = newSocket;

    const handleConnect = () => {
      console.log('✅ WebSocket connected:', newSocket.id);
      setIsConnected(true);
    };

    const handleDisconnect = (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    };

    const handleConnectError = (error: any) => {
      console.error('🚫 WebSocket connection error:', error);
      setIsConnected(false);
    };

    const handleGpuUpdate = (data: ClusterGPUData[]) => {
      if (data && data.length > 0) {
        const clusterName = data[0].clusterName;
        console.log(`📊 Frontend received GPU data for ${clusterName}`, data.length, 'nodes');
        
        // Use functional update to prevent state conflicts
        setGpuData(prevData => {
          const newData = { ...prevData };
          newData[clusterName] = data;
          return newData;
        });
      }
    };

    const handleGpuError = (error: { error: string }) => {
      console.error('❌ GPU data error:', error);
    };

    // Attach all event listeners
    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('connect_error', handleConnectError);
    newSocket.on('gpu-update', handleGpuUpdate);
    newSocket.on('gpu-error', handleGpuError);

    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up WebSocket listeners only');
      // Only remove listeners, don't disconnect
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      newSocket.off('connect_error', handleConnectError);
      newSocket.off('gpu-update', handleGpuUpdate);
      newSocket.off('gpu-error', handleGpuError);
    };
  }, []);

  // Global cleanup on page unload
  useEffect(() => {
    const cleanup = () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket on page unload');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };

    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []);

  const subscribeToCluster = (clusterName: string) => {
    if (socket && isConnected && !subscribedClustersRef.current.has(clusterName)) {
      console.log(`🎯 Subscribing to cluster: ${clusterName}`);
      socket.emit('subscribe-gpu-updates', clusterName);
      subscribedClustersRef.current.add(clusterName);
    }
  };

  const unsubscribeFromCluster = (clusterName: string) => {
    if (subscribedClustersRef.current.has(clusterName)) {
      console.log(`🚫 Unsubscribing from cluster: ${clusterName}`);
      subscribedClustersRef.current.delete(clusterName);
      setGpuData(prev => {
        const newData = { ...prev };
        delete newData[clusterName];
        return newData;
      });
    }
  };

  return (
    <WebSocketContext.Provider value={{
      socket,
      isConnected,
      gpuData,
      subscribeToCluster,
      unsubscribeFromCluster
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}