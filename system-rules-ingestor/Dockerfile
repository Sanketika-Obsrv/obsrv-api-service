# DHI-hardened system-rules-ingestor (node batch job).
# Build deps on the -dev variant (has npm), run on the minimal hardened node runtime.
FROM dhi.io/node:22-alpine3.22-dev AS build
WORKDIR /opt/app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .

FROM dhi.io/node:22-alpine3.22
WORKDIR /opt/app
# uid 1000 is this image's own baked-in default (confirmed via `docker inspect .Config.User`) --
# made explicit here so it's documented and can't silently change if the base image's default
# ever does. --chown matches it so /opt/app is actually readable as that user, not root-owned.
COPY --from=build --chown=1000:1000 /opt/app /opt/app
USER 1000
# No HEALTHCHECK: this is a one-shot batch job (runs index.js to completion, then exits) --
# not a long-running service, so there's no "is it healthy" state for Docker to poll.
CMD ["node", "index.js"]
