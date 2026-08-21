# DHI hardened build. Dev variant (shell + npm + toolchain) for install/build; minimal
# shell-less non-root runtime. Runtime actually runs `ts-node/register` against the raw
# src/*.ts (see CMD below) -- NOT a tsc-compiled dist/ build. ts-node + typescript ship as
# runtime deps and the app type-checks at container start, not at build time. This is
# intentional for now: a tsc build wouldn't carry over assets loaded via fs.readFileSync
# (e.g. src/configs/alertsConfig.json) or the top-level swagger-doc/ dir, both of which
# `tsc` only copies for statically-imported files -- switching to dist/ needs an explicit
# asset-copy step first, not just a CMD change.
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
# Exec-form + node's own net module: the runtime image is shell-less (no /bin/sh, no curl/wget),
# so this can't be a shell-form/curl healthcheck. A bare TCP connect is enough to confirm the
# server is accepting connections (no reliance on a specific route existing).
# Port read from process.env.api_port (Config.ts's actual env var, matching app.listen) with a
# 3000 fallback -- NOT process.env.PORT, which this app never sets or reads.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "var p=process.env.api_port||3000;var s=require('net').connect(p,'127.0.0.1');s.on('connect',function(){s.end();process.exit(0)});s.on('error',function(){process.exit(1)})"]
CMD ["node", "-r", "ts-node/register", "./src/app.ts"]
