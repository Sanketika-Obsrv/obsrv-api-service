FROM node:18-alpine
RUN mkdir -p /opt/api-service
WORKDIR /opt
COPY . .
WORKDIR /opt/api-service
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "start"]
