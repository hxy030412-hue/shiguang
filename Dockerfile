FROM node:20-slim AS frontend
RUN apt-get update && apt-get install -y python3 make g++ libatomic1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim AS backend
RUN apt-get update && apt-get install -y python3 make g++ libatomic1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server ./server
COPY --from=frontend /app/dist ./dist
RUN mkdir -p /data/uploads
EXPOSE 3000
CMD ["node", "server/index.js"]