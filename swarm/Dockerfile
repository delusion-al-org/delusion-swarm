# Stage 1: Build
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy workspace structure for bun install resolution
COPY package.json bun.lock* ./
COPY swarm/package.json swarm/package.json
COPY packages/blocks/package.json packages/blocks/package.json
COPY seeds/restaurant/package.json seeds/restaurant/package.json

# Stub dir so workspace glob resolves
RUN mkdir -p seeds

RUN bun install --frozen-lockfile

# Copy actual source code
COPY packages/ packages/
COPY swarm/ swarm/

RUN cd swarm && bun run build

# Stage 2: Run
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/swarm/.mastra/output ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=4111
EXPOSE 4111

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:4111/health || exit 1

CMD ["node", "index.mjs"]
