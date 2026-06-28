# ── Build stage: install deps + build the web client ──────────────────────────
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime stage: serve web + API + WS + MCP from one process/port ───────────
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8787

# Bring over installed deps (incl. tsx) and the bits the server needs at runtime.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig*.json ./

# Board state persists here (mount a volume to keep it across restarts).
VOLUME ["/app/server/data"]
EXPOSE 8787

# Serves dist/ + /api + /ws + /mcp on $PORT.
CMD ["node_modules/.bin/tsx", "server/index.ts"]
