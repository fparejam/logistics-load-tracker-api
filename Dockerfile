# Use Bun official image as base
FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Build the application using Bun
# Use Docker secrets - secrets will be passed via --build-secret during deploy
RUN --mount=type=secret,id=VITE_CONVEX_URL \
    --mount=type=secret,id=VITE_MAPBOX_API_TOKEN \
    --mount=type=secret,id=VITE_AG_CHARTS_LICENSE \
    export VITE_CONVEX_URL="$(cat /run/secrets/VITE_CONVEX_URL 2>/dev/null || echo '')" && \
    export VITE_MAPBOX_API_TOKEN="$(cat /run/secrets/VITE_MAPBOX_API_TOKEN 2>/dev/null || echo '')" && \
    export VITE_AG_CHARTS_LICENSE="$(cat /run/secrets/VITE_AG_CHARTS_LICENSE 2>/dev/null || echo '')" && \
    echo "Building with secrets..." && \
    bun run build

# Production stage - use Bun's slim image
FROM oven/bun:1-slim AS production

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Copy node_modules from build stage to include all dependencies
# including platform-specific ones like @tailwindcss/oxide-linux-x64-musl
COPY --from=base /app/node_modules ./node_modules

# Copy built files from build stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/convex ./convex

# Expose port (Fly.io will set PORT env var)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Health check using Bun
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:8080/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the server using Bun
CMD ["bun", "run", "dist/index.js"]

