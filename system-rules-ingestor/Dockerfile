FROM --platform=linux/amd64 node:20.10-alpine
WORKDIR /opt/app
COPY ./package.json .
RUN yarn install --silent
COPY . .
CMD ["yarn", "run", "start"]