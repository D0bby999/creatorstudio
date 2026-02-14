# ─── Stage 1: Base ───
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.6.1 --activate
RUN apk add --no-cache libc6-compat openssl

# ─── Stage 2: Dependencies ───
FROM base AS deps
WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ai/package.json ./packages/ai/
COPY packages/auth/package.json ./packages/auth/
COPY packages/canvas/package.json ./packages/canvas/
COPY packages/crawler/package.json ./packages/crawler/
COPY packages/db/package.json ./packages/db/
COPY packages/redis/package.json ./packages/redis/
COPY packages/social/package.json ./packages/social/
COPY packages/ui/package.json ./packages/ui/
COPY packages/video/package.json ./packages/video/
COPY packages/webhooks/package.json ./packages/webhooks/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ─── Stage 3: Builder ───
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/ai/node_modules ./packages/ai/node_modules
COPY --from=deps /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=deps /app/packages/canvas/node_modules ./packages/canvas/node_modules
COPY --from=deps /app/packages/crawler/node_modules ./packages/crawler/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/redis/node_modules ./packages/redis/node_modules
COPY --from=deps /app/packages/social/node_modules ./packages/social/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/video/node_modules ./packages/video/node_modules
COPY --from=deps /app/packages/webhooks/node_modules ./packages/webhooks/node_modules

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all source files
COPY apps ./apps
COPY packages ./packages

# Generate Prisma client
RUN pnpm exec prisma generate --schema=./packages/db/prisma/schema.prisma

# Build application
ENV NODE_ENV=production
RUN pnpm turbo build --filter=web

# ─── Stage 4: Runner ───
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 creator

# Copy necessary files
COPY --from=builder --chown=creator:nodejs /app/package.json ./
COPY --from=builder --chown=creator:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=creator:nodejs /app/turbo.json ./

# Copy built application
COPY --from=builder --chown=creator:nodejs /app/apps/web/build ./apps/web/build
COPY --from=builder --chown=creator:nodejs /app/apps/web/package.json ./apps/web/

# Copy packages (only necessary runtime files)
COPY --from=builder --chown=creator:nodejs /app/packages ./packages

# Copy production node_modules
COPY --from=builder --chown=creator:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=creator:nodejs /app/apps/web/node_modules ./apps/web/node_modules

USER creator

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

WORKDIR /app/apps/web

CMD ["node", "./build/server/index.js"]
