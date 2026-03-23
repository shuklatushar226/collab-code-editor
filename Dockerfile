# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Copy shared package source (bundled inline by esbuild — no npm install needed)
COPY shared/ ./shared/

# Copy server and install its dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Copy server source and build
COPY server/ .
RUN node build.mjs

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init
WORKDIR /app
ENV NODE_ENV=production

# Copy built bundle + SQL migrations
COPY --from=builder /app/server/dist ./dist

# Copy package files and install only production deps
COPY --from=builder /app/server/package*.json ./
RUN npm install --omit=dev

EXPOSE 3001
USER node
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
