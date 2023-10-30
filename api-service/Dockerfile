# FROM node:18-alpine
# RUN mkdir -p /opt/api-service
# WORKDIR /opt
# COPY api-service/package.json
# WORKDIR /opt/api-service
# RUN npm install
# EXPOSE 3000
# CMD ["npm", "run", "start"]

FROM --platform=linux/amd64 node:20-alpine
RUN pwd
RUN mkdir -p /opt/api-service
RUN pwd
WORKDIR /opt/api-service
RUN pwd
COPY api-service/package*.json ./
RUN pwd
RUN npm install
COPY . .
RUN pwd
EXPOSE 3000
CMD ["npm", "run", "start"]
