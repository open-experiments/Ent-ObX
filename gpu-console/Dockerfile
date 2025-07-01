# Build stage for backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Build stage for frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy backend build and dependencies
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --production

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy config directory
WORKDIR /app
COPY config ./config

# Install serve for frontend
RUN npm install -g serve

# Expose ports
EXPOSE 3001 3000

# Start script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

CMD ["./docker-entrypoint.sh"]