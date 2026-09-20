# Production Dockerfile for Strykon Finance OS
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy built server and static assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/public ./public
COPY --from=builder /app/strykon-finance.html ./strykon-finance.html

# Expose container port
EXPOSE 3000

# Start compiled CommonJS server
CMD ["node", "dist/server.cjs"]
