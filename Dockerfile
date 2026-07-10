FROM node:18-slim AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-slim AS backend
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server ./server
COPY --from=frontend /app/dist ./dist
RUN mkdir -p /data/uploads
ENV DATA_DIR=/data
EXPOSE 3000
CMD ["node", "server/index.js"]
