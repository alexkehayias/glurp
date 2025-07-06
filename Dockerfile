FROM node:24-alpine AS builder

WORKDIR /
COPY ./src ./src
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json
COPY ./components ./components
COPY ./components.json ./components.json
COPY ./tsconfig.json ./tsconfig.json
COPY ./tailwind.config.js ./tailwind.config.js
COPY ./vite.config.mjs ./vite.config.mjs
COPY ./config/secrets.prod.toml ./config/secrets.prod.toml
COPY ./index.html ./index.html
RUN npm install
RUN npm run build

FROM nginx:alpine-slim

WORKDIR /

COPY --from=builder /dist /usr/share/nginx/html
