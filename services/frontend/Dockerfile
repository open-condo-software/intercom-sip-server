FROM nginx:1.24-alpine

RUN apk add nodejs npm git
RUN rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . /app

ARG SIP_SERVER_IP

ENV SIP_SERVER_IP=$SIP_SERVER_IP

RUN npm run build
RUN rm -rf ./node_modules

COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i -E "s/SERVER_IP/$SIP_SERVER_IP/" /etc/nginx/conf.d/default.conf

EXPOSE 80
