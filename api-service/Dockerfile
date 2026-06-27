# Build stage — compile TypeScript on the DHI node -dev image.
FROM dhi.io/node:24-alpine-dev AS build
WORKDIR /opt/api-service
COPY api-service/package.json ./
RUN npm install
COPY api-service/ ./
RUN rm -rf postman-collection
# Compile WITHOUT declaration files: the app's dynamic loader (scrapModules) does
# require() on EVERY file in a directory; emitted .d.ts files would be require()d and
# crash at startup. Then copy the JSON assets tsc does not emit (resolveJsonModule
# imports compile to require('./*.json')).
RUN npx tsc -P . --declaration false --outDir dist && \
    ( cd src && tar cf - $(find . -name '*.json') ) | ( cd dist && tar xf - ) && \
    cp package.json dist/package.json
# Keep only production deps for the runtime stage.
RUN npm prune --omit=dev

# Runtime stage — DHI distroless node (no shell/npm, non-root by default).
FROM dhi.io/node:24-alpine
WORKDIR /opt/api-service
COPY --from=build /opt/api-service/dist ./dist
COPY --from=build /opt/api-service/node_modules ./node_modules
# AlertsConfigService reads <cwd>/src/configs/alertsConfig.json by default.
COPY --from=build /opt/api-service/src/configs ./src/configs
EXPOSE 3000
# `npm run start` was `ts-node ./src/app.ts`; run the compiled output directly.
CMD ["node", "dist/app.js"]
