#stage 1 builder
FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate


COPY . .

# stage2  using production runner
FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production


# Copy generated Prisma client and necessary application code from the builder stage
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma

COPY . .





# Create logs directory and give permission
RUN mkdir -p /app/logs && chown -R node:node /app

USER node

EXPOSE 3082


CMD ["node", "server.js"]
