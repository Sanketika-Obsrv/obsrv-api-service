FROM node:18-alpine
RUN mkdir -p /opt/obsrv-api-service
WORKDIR /opt/obsrv-api-service/
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]