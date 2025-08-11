FROM node:18-alpine AS frontend-builder

# Set the working directory
WORKDIR /app

# Copy the package manifests and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy the source code and build the frontend
COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------
# Stage 2: Build the Go Backend
# ------------------------------------------------------------------
  FROM golang:1.24.4-alpine AS go-builder

  # Create a working directory for the Go application
  WORKDIR /backend
  
  # Copy go.mod and go.sum first to leverage Docker caching
  COPY backend/go.mod backend/go.sum ./
  RUN go mod download
  
  # Copy the rest of the Go application source code
  COPY backend/ ./
  
  # Compile the Go program
  # The CGO_ENABLED=0 setting produces a fully static binary
  # GOOS=linux ensures it's built for a Linux environment
  RUN CGO_ENABLED=0 GOOS=linux go build -o /backend/cmd/server/server cmd/server/main.go
  
  
  # ------------------------------------------------------------------
  # Stage 3: Final, minimal image
  # ------------------------------------------------------------------
  FROM alpine:latest
  
  # Create a working directory to hold the server binary & static files
  WORKDIR /server
  
  # Copy the compiled Go binary from the go-builder stage
  COPY --from=go-builder /backend/cmd/server /server/
  
  # Copy the built React static assets from the frontend-builder stage
  COPY --from=frontend-builder /app/build /server/public
  
  # Expose the port your Go server will listen on
  EXPOSE 8080
  
  # Run the compiled Go server
  CMD ["/server/server"]
