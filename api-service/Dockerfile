FROM --platform=linux/amd64 node:23.4-alpine
RUN mkdir -p /opt/api-service
COPY ./api-service  ./opt/api-service
WORKDIR /opt/api-service
RUN rm -rf postman-collection
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]