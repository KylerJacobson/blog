# Pull the base image. You can choose alpine for a smaller base image
FROM node:20-alpine

# Set your working directory in the container
WORKDIR /app 

# Copy the package.json and package-lock.json to the working directory
COPY package*.json ./ 

# Install the dependencies
RUN npm install 

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . . 

# Make port 3000 available to the world outside this container
EXPOSE 3000 

# Run the app
CMD ["npm", "start"]
