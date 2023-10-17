FROM node:18-alpine
RUN mkdir -p /opt/obsrv-api-service/api-service
WORKDIR /opt/obsrv-api-service/api-service
RUN pwd && ls
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]