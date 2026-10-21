# Builds one web client (CLIENT=react or CLIENT=vue) and serves it with nginx.
# The build context is parking/, because the clients import ../shared and the vanilla stylesheet.
FROM node:24-alpine AS build
ARG CLIENT
WORKDIR /parking/clients/${CLIENT}

COPY clients/${CLIENT}/package.json clients/${CLIENT}/package-lock.json ./
RUN npm ci

COPY clients/shared /parking/clients/shared
COPY server/public/styles.css /parking/server/public/styles.css
COPY clients/${CLIENT} ./
RUN npm run build

FROM nginx:1.30-alpine
ARG CLIENT
COPY clients/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /parking/clients/${CLIENT}/dist /usr/share/nginx/html
