# ==========================================
# Stage 1: Build & Compile
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for native modules / Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package manifests and Prisma schema first to leverage layer caching
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source files and configuration
COPY src ./src/
COPY tsconfig.json ./

# Generate Prisma Client after copying source so stale generated files cannot overwrite it,
# then compile TypeScript to dist/
RUN npm run build

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime libraries for Prisma
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=5000

# Create app directory permissions for non-root node user
RUN chown -R node:node /app

# Copy production artifacts from builder stage
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma/
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

# Run container with least privilege non-root user
USER node

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Apply migrations before accepting traffic, then start the compiled API.
# Prisma remains installed so a fresh production database is provisioned.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
