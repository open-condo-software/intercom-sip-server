FROM nginx:1.24-alpine

RUN apk add nodejs npm git
RUN rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . /app

ARG VITE_SIP_SERVER_IP
ARG VITE_SIP_SERVER_URL

ENV VITE_SIP_SERVER_IP=$VITE_SIP_SERVER_IP
ENV VITE_SIP_SERVER_URL=$VITE_SIP_SERVER_URL

# RUN printenv >> .env

RUN npm run build
RUN rm -rf ./node_modules

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
