# build stage
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# production stage
FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production

# copy everything from builder to prod
COPY --from=builder /app ./

# create logs dir and set permissions
RUN mkdir -p /app/logs && chown -R node:node /app

USER node
EXPOSE 3082
CMD ["node", "server.js"]
