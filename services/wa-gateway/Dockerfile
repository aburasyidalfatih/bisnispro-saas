FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files from the sub-service
COPY services/wa-gateway/package*.json ./
RUN npm ci

# Copy prisma schema from the root and generate client
COPY prisma ./prisma
RUN npx prisma@5.22.0 generate

# Copy the rest of the source code
COPY services/wa-gateway/src ./src
COPY services/wa-gateway/tsconfig.json ./

# Build TypeScript
RUN npx tsc

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 4000
CMD ["node", "dist/index.js"]
