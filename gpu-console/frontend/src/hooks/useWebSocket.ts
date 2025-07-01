import { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection only if it doesn't exist
    if (!socketRef.current) {
      console.log('🔌 Creating new WebSocket connection');
      
      const newSocket = io('http://127.0.0.1:3001', {
        transports: ['websocket'],
        upgrade: false,
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
      });

      newSocket.on('connect', () => {
        console.log('✅ WebSocket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🚫 WebSocket connection error:', error);
        setIsConnected(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } else {
      setSocket(socketRef.current);
      setIsConnected(socketRef.current.connected);
    }

    return () => {
      // Don't cleanup the socket here to maintain connection
    };
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log('🔌 Cleaning up WebSocket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return { socket, isConnected };
}