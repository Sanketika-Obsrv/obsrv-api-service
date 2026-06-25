# api-service runs via ts-node (`npm run start`) and its compiled output is not
# directly node-runnable (extensionless relative imports / ESM resolution), so a
# distroless runtime is not viable without a codebase-wide module refactor.
# Use the hardened DHI node -dev variant (near-zero-CVE base, retains npm + ts-node).
# TODO(hardening): refactor module resolution to ship a distroless `node dist/app.js` runtime.
FROM dhi.io/node:24-alpine-dev
WORKDIR /opt/api-service
COPY api-service/package.json ./
RUN npm install
COPY api-service/ ./
RUN rm -rf postman-collection
EXPOSE 3000
CMD ["npm", "run", "start"]
