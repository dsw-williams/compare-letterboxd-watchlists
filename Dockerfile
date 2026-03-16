# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Run (with Chromium pre-installed)
FROM mcr.microsoft.com/playwright:v1.58.2-noble AS runner
ENV NODE_ENV=production

# Install gosu for PUID/PGID privilege-dropping (required for Unraid)
RUN apt-get update && apt-get install -y --no-install-recommends gosu && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN mkdir -p /app/data

# Default PUID/PGID — override to match your host user (see README)
ENV PUID=1000 PGID=1000
ENV PORT=3000 HOSTNAME="0.0.0.0"

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
