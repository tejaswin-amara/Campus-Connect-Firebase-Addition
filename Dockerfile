# Multi-stage Dockerfile for Campus Event Manager (Spring Boot + React SPA)

# --- Stage 1: Build Frontend (Node.js) ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build Backend (Java 21 / Spring Boot) ---
FROM eclipse-temurin:21-jdk-alpine AS backend-builder
WORKDIR /app
COPY mvnw mvnw
COPY .mvn .mvn
COPY pom.xml pom.xml
RUN chmod +x mvnw && ./mvnw dependency:resolve -B
COPY src src

# Copy frontend build into Spring Boot static resources folder
COPY --from=frontend-builder /app/frontend/dist /app/src/main/resources/static/

RUN ./mvnw clean package -DskipTests -B

# --- Stage 3: Runtime ---
FROM eclipse-temurin:21-jre-alpine

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --from=backend-builder /app/target/campus-event-manager-0.0.1-SNAPSHOT.jar app.jar
RUN mkdir -p uploads && chown -R appuser:appgroup /app/uploads

ENV UPLOAD_DIR=/app/uploads
USER appuser

ARG PORT=9090
ENV PORT=${PORT}
EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=5 \
  CMD sh -c "wget --no-verbose --tries=1 --spider http://localhost:${PORT}/actuator/health || exit 1"

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
