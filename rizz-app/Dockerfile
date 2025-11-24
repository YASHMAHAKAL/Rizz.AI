# Step 1: Build the application
# We use the official Node.js image as the base image for the build stage.
# 'alpine' is a lightweight Linux distribution, making the image smaller.
FROM node:20-alpine AS builder

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
# This way, if you change your code but not dependencies, npm install won't re-run
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Build the application for production
# This creates the 'dist' folder with static files
RUN npm run build

# Step 2: Serve the application
# We use Nginx, a high-performance web server, to serve the static files.
FROM nginx:alpine

# Copy the built files from the 'builder' stage to Nginx's default html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to allow external access
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
