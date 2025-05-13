# ---- Build Stage ----
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Build the app
RUN npm run build

# ---- Production Stage ----
FROM node:18-alpine AS production
WORKDIR /app

# Copy only production dependencies and built files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.production .env

# Use a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose API and metrics ports
EXPOSE 3000 9464

# Healthcheck (optional, for Docker/K8s)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "dist/main.js"] 