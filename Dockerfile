FROM node:16
WORKDIR /app
COPY . ./

RUN yarn install && \
    yarn build && \
    yarn rimraf src && \
    apt-get update && \
    apt-get install jq -y && \
    yarn remove $(cat package.json | jq -r '.devDependencies | keys | join(" ")') && \
    apt-get remove jq -y && \
    yarn cache clean && yarn cache clean --mirror
ENTRYPOINT ["node", "dist/index.js"]
