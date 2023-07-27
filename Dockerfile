# Pull the base image. You can choose alpine for a smaller base image
FROM node:20-alpine as builder

# Set your working directory in the container
WORKDIR /app 

# Copy the package.json and package-lock.json to the working directory
COPY package*.json ./ 

# Install the dependencies
RUN npm install 

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . . 

# Build the application
RUN npm run build

FROM nginx:1.25.1
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/build .
ENTRYPOINT ["nginx", "-g", "daemon off;"]
