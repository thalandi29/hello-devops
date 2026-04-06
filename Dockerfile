# Start from the official Node.js 20 image, alpine variant
# alpine = tiny Linux (5MB). The full node image is 900MB.
FROM node:20-alpine
 
# Set the working directory inside the container
# All following commands run from here
WORKDIR /app
 
# Copy ONLY package.json first (smart caching trick)
# Docker caches each layer. If package.json hasn't changed,
# npm install is skipped on the next build — much faster!
COPY package.json ./
 
# Install dependencies
RUN npm install --production
 
# Now copy the rest of the app code
# This layer only rebuilds when code changes, not when deps change
COPY . .
 
# Tell Docker this container listens on port 3000
# (This is documentation only — doesn't actually open the port)
EXPOSE 3000
 
# Create and switch to a non-root user — security best practice
# Never run containers as root!
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
 
# Default command when the container starts
CMD ["node", "server.js"]

