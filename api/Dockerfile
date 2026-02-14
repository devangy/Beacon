FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .


# Create logs directory and give permission
RUN mkdir -p /app/logs && chown -R node:node /app

RUN npx prisma generate
RUN npm prune --production
USER node

EXPOSE 3082


CMD ["node", "server.js"]
