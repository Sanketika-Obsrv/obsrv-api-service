FROM node:18-alpine
RUN mkdir -p /opt/api-service
WORKDIR /opt
COPY api-service/package.json
WORKDIR /opt/api-service
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "start"]