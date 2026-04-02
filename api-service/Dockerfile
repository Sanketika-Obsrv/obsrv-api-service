# Build stage
FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:24.13.1-slim AS builder
RUN npm install -g npm@11.10.1 \
 && npm pack tar@7.5.11 \
 && tar -xzf tar-7.5.11.tgz -C /usr/local/lib/node_modules/npm/node_modules/tar --strip-components=1 \
 && rm tar-7.5.11.tgz \
 && npm install -g minimatch@10.2.2 \
 && npm cache clean --force \
 && rm -rf /usr/local/lib/node_modules/npm/node_modules/minimatch \
 && cp -r /usr/local/lib/node_modules/minimatch /usr/local/lib/node_modules/npm/node_modules/
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates openssl \
 && apt-get upgrade -y \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/api-service
# Install all dependencies for building
COPY api-service/package.json api-service/package-lock.json ./
RUN npm ci --ignore-scripts
# Copy source code and build
COPY api-service/tsconfig.json ./
COPY api-service/src/ ./src/
COPY api-service/@types/ ./@types/
RUN npm run build
# Remove declaration files to avoid module resolution conflicts
RUN find dist -name "*.d.ts" -delete

# Production stage
FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:24.13.1-slim AS production
RUN npm install -g npm@11.10.1 \
 && npm pack tar@7.5.11 \
 && tar -xzf tar-7.5.11.tgz -C /usr/local/lib/node_modules/npm/node_modules/tar --strip-components=1 \
 && rm tar-7.5.11.tgz \
 && npm install -g minimatch@10.2.2 \
 && npm cache clean --force \
 && rm -rf /usr/local/lib/node_modules/npm/node_modules/minimatch \
 && cp -r /usr/local/lib/node_modules/minimatch /usr/local/lib/node_modules/npm/node_modules/
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates openssl \
 && apt-get upgrade -y \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/api-service
# Copy package.json and install only production dependencies
COPY api-service/package.json api-service/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
# Copy built application from build stage
COPY --from=builder /opt/api-service/dist ./
# Verify the structure and ensure no declaration files
RUN ls -la && echo "=== Checking for .d.ts files ===" && find . -name "*.d.ts" | head -5 || echo "No .d.ts files found"
EXPOSE 3000
CMD ["node", "app.js"]