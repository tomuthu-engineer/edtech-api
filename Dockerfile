# ==============================================================================
# Stage 1: Base — shared OS deps
# ==============================================================================
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# ==============================================================================
# Stage 2: Dependencies
# ==============================================================================
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ==============================================================================
# Stage 3: Build
# ==============================================================================
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ==============================================================================
# Stage 4: Production dependencies only
# ==============================================================================
FROM base AS prod-deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

# ==============================================================================
# Stage 5: Runtime
# ==============================================================================
FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

RUN mkdir -p src/uploads/temporary && chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/server.js"]
