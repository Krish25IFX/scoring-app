FROM node:22-alpine AS builder

WORKDIR /app

# Install build tools for better-sqlite3 native addon
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm install --production

# --- Production stage (no build tools) ---
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY package.json index.js ./

# SQLite DB will be stored in /data (mount a PVC here)
RUN mkdir -p /data
ENV DB_PATH=/data/tournament.db

EXPOSE 3001

CMD ["node", "index.js"]
