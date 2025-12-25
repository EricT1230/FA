FROM node:20-alpine

# Install cron
RUN apk add --no-cache dcron

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

# Copy source code
COPY . .

# Copy crontab file
COPY crontab /etc/crontabs/root

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start cron and the scheduler
CMD ["sh", "-c", "crond -f -d 8 & node index.js"]