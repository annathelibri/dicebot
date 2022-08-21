FROM node:16
WORKDIR /app
COPY . ./

# Part 1. Install & Build
RUN yarn install --non-interactive --frozen-lockfile && yarn build && \
# Part 2. Reinstall with --production flag
    rm -rf src node_modules && yarn install --non-interactive --frozen-lockfile --prod --ignore-optional && \
# Part 3. Cleanup as much as possible
    yarn cache clean && yarn cache clean --mirror && rm -rf /root/.cache node_modules/@types
ENTRYPOINT ["node", "dist/index.js"]
