FROM node:20-alpine

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Install pnpm and configure store
RUN npm install -g pnpm && \
    pnpm config set store-dir /root/.local/share/pnpm/store

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Prune dev dependencies after build
RUN pnpm prune --prod

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["pnpm", "start"]