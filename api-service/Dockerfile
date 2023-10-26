FROM --platform=linux/amd64 node:20-alpine
RUN mkdir -p /opt/obsrv-api-service
WORKDIR /opt/obsrv-api-service/
COPY api-service/package*.json ./
RUN npm install
COPY . .
RUN pwd 
EXPOSE 3000
CMD ["npm", "run", "start"]