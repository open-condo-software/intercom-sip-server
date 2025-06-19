FROM oven/bun:alpine AS bundler

WORKDIR /app
COPY package.json package-lock.json ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun build --target node --outfile index.js index.ts

FROM node:lts-slim

WORKDIR /app

COPY --from=bundler /app/index.js /app/index.js


CMD ["node", "/app/index.js"]
