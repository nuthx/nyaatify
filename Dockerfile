# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first to leverage cache
COPY package*.json ./
RUN npm install

# Build the application
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4100
ENV HOSTNAME="0.0.0.0"

# Add non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set permissions and switch to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Configure runtime
EXPOSE 4100
CMD ["node", "server.js"]
