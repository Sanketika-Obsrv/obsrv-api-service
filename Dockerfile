FROM --platform=linux/amd64 node:20-alpine
RUN apk add libcrypto3=3.3.0-r2 libssl3=3.3.0-r2
RUN apk upgrade
RUN mkdir -p /opt/obsrv-api-service
WORKDIR /opt/obsrv-api-service/
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]
