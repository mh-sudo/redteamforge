FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

# Nitro output carries everything it needs; install its traced deps (if any).
COPY --from=build /app/.output ./.output
RUN cd .output/server && [ -f package.json ] && npm install --omit=dev --no-audit --no-fund || true

USER node
EXPOSE 8080

CMD ["node", ".output/server/index.mjs"]
