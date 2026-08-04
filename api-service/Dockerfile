# DHI hardened build. Dev variant (shell + npm + toolchain) for install/build; minimal
# shell-less non-root runtime. dataset-api compiles TS -> dist/ (tsc) and starts via plain
# `node` — no shell/npm/ts-node needed at runtime (tsconfig has no path aliases, so no
# tsconfig-paths at runtime either).
# Build context is the REPO ROOT (CI: `-f api-service/Dockerfile .`), so COPY paths are
# prefixed with api-service/.
ARG BUILD_IMAGE=dhi.io/node:24-alpine3.24-dev
ARG RUNTIME_IMAGE=dhi.io/node:24-alpine3.24

# Stage 1 - install deps (keeps the build/dev toolchain out of the final image layers)
FROM ${BUILD_IMAGE} AS build
WORKDIR /opt/api-service
# package-lock.json is gitignored (not in the CI git context), so copy only package.json.
COPY api-service/package.json ./
RUN npm install
COPY api-service/ .
RUN rm -rf postman-collection

# Stage 2 - runtime (DHI hardened, non-root). Runs ts-node like the original image; ts-node +
# typescript are devDependencies needed at runtime, so node_modules is copied intact (no prune).
FROM ${RUNTIME_IMAGE}
WORKDIR /opt/api-service
COPY --chown=node:node --from=build /opt/api-service .
USER node
EXPOSE 3000
CMD ["node", "-r", "ts-node/register", "./src/app.ts"]
