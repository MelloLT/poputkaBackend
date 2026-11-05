# ---------- build ----------
FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- runtime ----------
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Папка для картинок. В docker-compose сюда монтируется volume,
# поэтому файлы не пропадают при пересборке/обновлении контейнера.
RUN mkdir -p /app/uploads/avatars /app/uploads/cars && chown -R node:node /app
USER node

EXPOSE 5000
CMD ["node", "dist/index.js"]
