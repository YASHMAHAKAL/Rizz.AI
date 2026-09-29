# Step 1: Build the application
# We use the official Node.js image as the base image for the build stage.
# 'alpine' is a lightweight Linux distribution, making the image smaller.
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS builder

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
# This way, if you change your code but not dependencies, npm install won't re-run
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --ignore-scripts --no-audit --no-fund

# Copy the rest of the application code to the container
COPY . .

# Build the application for production
# This creates the 'dist' folder with static files
RUN npm run build

# Step 2: Serve the application
# We use Nginx, a high-performance web server, to serve the static files.
FROM nginx:stable-alpine@sha256:985220252f3863977e468f611ef118ebd01421289dd86ee1ae99cb068c3bce2b

# Copy the built files from the 'builder' stage to Nginx's default html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-main.conf /etc/nginx/nginx.conf
RUN nginx -V 2>&1 | grep -q -- --with-http_auth_request_module
USER 101:101
ENTRYPOINT []

# Expose port 80 to allow external access
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=4s --start-period=10s --retries=3 CMD wget -q -T 3 -O /dev/null http://127.0.0.1:8080/readyz || exit 1

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
