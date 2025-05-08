# Base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Cache dependencies installation
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build Next.js application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production environment
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=4100

# Setup non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create database directory and set permissions
RUN mkdir -p /app/data
RUN chown -R nextjs:nodejs /app/data

# Copy production assets from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma

# Persist data storage
VOLUME ["/app/data"]

# Switch to non-root for security
USER nextjs

# Expose application port
EXPOSE 4100

# Start application
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
