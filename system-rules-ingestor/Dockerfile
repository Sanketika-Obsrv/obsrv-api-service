# DHI-hardened system-rules-ingestor (node batch job).
# Build deps on the -dev variant (has npm), run on the minimal hardened node runtime.
FROM dhi.io/node:20-alpine3.22-dev AS build
WORKDIR /opt/app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .

FROM dhi.io/node:20-alpine3.22
WORKDIR /opt/app
COPY --from=build /opt/app /opt/app
CMD ["node", "index.js"]
