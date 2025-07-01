#!/bin/bash

echo "Starting GPU Console..."

# Start backend
cd backend && npm run dev &
BACKEND_PID=$!

sleep 2

# Start frontend
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ GPU Console started!"
echo "   Backend: http://127.0.0.1:3001"
echo "   Frontend: http://127.0.0.1:5173"
echo ""
echo "Press Ctrl+C to stop"

cleanup() {
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT
wait