FROM node:18-alpine
RUN mkdir -p /opt/obsrv-api-service/api-service
WORKDIR /opt/obsrv-api-service/api-service
COPY . .
RUN pwd && ls
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "start"]