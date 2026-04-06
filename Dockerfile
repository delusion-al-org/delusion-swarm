# Stage 1: Install deps + build with bun
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Stage 2: Run with Node (mastra build outputs .mjs for Node)
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.mastra/output ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=4111

EXPOSE 4111

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:4111/health || exit 1

CMD ["node", "index.mjs"]
