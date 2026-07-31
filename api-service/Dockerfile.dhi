# DHI hardened build. Dev variant (shell + npm + toolchain) for install/build; minimal
# shell-less non-root runtime. dataset-api compiles TS -> dist/ (tsc) and starts via plain
# `node` — no shell/npm/ts-node needed at runtime (tsconfig has no path aliases, so no
# tsconfig-paths at runtime either). Build from this directory: `docker build -f Dockerfile.dhi .`
ARG BUILD_IMAGE=dhi.io/node:24-alpine3.24-dev
ARG RUNTIME_IMAGE=dhi.io/node:24-alpine3.24

# Stage 1 - build (tsc -> dist)
FROM ${BUILD_IMAGE} AS build
WORKDIR /opt/api-service
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN rm -rf postman-collection \
    && npm run build \
    && npm prune --omit=dev

# Stage 2 - runtime (minimal, shell-less, non-root)
FROM ${RUNTIME_IMAGE}
WORKDIR /opt/api-service
COPY --chown=node:node --from=build /opt/api-service/dist ./dist
COPY --chown=node:node --from=build /opt/api-service/node_modules ./node_modules
COPY --chown=node:node --from=build /opt/api-service/package.json ./package.json
USER node
EXPOSE 3000
CMD ["node", "dist/app.js"]
