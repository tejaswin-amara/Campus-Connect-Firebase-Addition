# Multi-stage Dockerfile for Campus Connect (React SPA + Nginx)

# --- Stage 1: Build Frontend (Node.js) ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# --- Stage 2: Serve via Nginx alpine ---
FROM nginx:stable-alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
