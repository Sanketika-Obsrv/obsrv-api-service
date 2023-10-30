# FROM node:18-alpine
# RUN mkdir -p /opt/api-service
# WORKDIR /opt
# COPY api-service/package.json
# WORKDIR /opt/api-service
# RUN npm install
# EXPOSE 3000
# CMD ["npm", "run", "start"]

# FROM --platform=linux/amd64 node:20-alpine
# RUN mkdir -p /opt/api-service
# COPY /api-service/package*.json ./api-service
# RUN pwd 
# RUN cd /opt/api-service
# RUN ls   
# RUN npm install
# COPY .  .
# RUN pwd
# EXPOSE 3000
# CMD ["npm", "run", "start"]

FROM --platform=linux/amd64 node:20-alpine
RUN mkdir -p /opt/api-service
WORKDIR /opt/api-service
COPY ./api-service/package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]


# FROM --platform=linux/amd64 node:20-alpine
# RUN mkdir -p /opt/api-service
# WORKDIR /opt/api-service
# COPY package*.json ./
# RUN npm install
# COPY . .
# EXPOSE 3000
# CMD ["npm", "run", "start"]