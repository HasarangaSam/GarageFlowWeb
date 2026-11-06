FROM node:22-alpine

WORKDIR /app

# Prisma needs OpenSSL at build and runtime.
RUN apk add --no-cache openssl libc6-compat

# Update the npm bundled with the Node image to a release with patched dependencies.
RUN npm install --global npm@12.2.2

ENV PORT=5000

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src/

RUN npm ci && npm run build

ENV NODE_ENV=production

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Apply database migrations before starting the API.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
