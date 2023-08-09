# Frontend
FROM node:latest AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Backend
FROM node:latest
WORKDIR /server
COPY server/package*.json ./
RUN npm install
COPY --from=build /app/build /server/public
COPY server/ ./
EXPOSE 8080
CMD ["npm", "run", "start"]
