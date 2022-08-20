FROM node:16
WORKDIR /app
COPY . ./
RUN yarn install && yarn build
ENTRYPOINT ["node", "dist/index.js"]
