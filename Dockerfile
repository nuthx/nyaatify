# Stage 1: Build application
FROM node:20-alpine AS builder
WORKDIR /app

# Cache dependencies installation
COPY package*.json ./
RUN npm install

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Build Next.js application
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

# Configure runtime environment
ENV NODE_ENV=production \
    PORT=4100 \
    HOSTNAME="0.0.0.0"

# Setup non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Prepare application directory
WORKDIR /app

# Copy production assets from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Initialize application startup
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh && \
    mkdir -p data && \
    chown -R nextjs:nodejs /app

# Persist data storage
VOLUME ["/app/data"]

# Switch to non-root for security
USER nextjs

# Expose application port
EXPOSE 4100
CMD ["/app/start.sh"]
