# The build context is parking/, because the server loads the shared checks from
# ../clients/shared. The folders keep the same layout here as in the repository.
FROM node:24-alpine

WORKDIR /parking/server

COPY server/package.json ./
RUN npm install --omit=dev

COPY clients/shared /parking/clients/shared
COPY server ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
