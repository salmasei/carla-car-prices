FROM node:24-bookworm AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci

COPY backend backend
COPY frontend frontend
COPY data data
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV STATIC_DIR=/app/frontend/dist

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --omit=dev -w backend

COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/frontend/dist frontend/dist
COPY data data

EXPOSE 4000
CMD ["node", "backend/dist/index.js"]
