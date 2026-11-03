# ====================================================================
# Stage 1: Build React Production Frontend
# ====================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build production bundle into /app/dist
RUN npm run build

# ====================================================================
# Stage 2: Production Container Runner
# ====================================================================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend server code and built React frontend
COPY server/ ./server/
COPY --from=builder /app/dist ./dist

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["node", "server/server.js"]
