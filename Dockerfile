FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV HOST=0.0.0.0
ENV PORT=8080
ENV NODE_ENV=production

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "preview"]
