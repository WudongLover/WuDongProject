FROM m.daocloud.io/docker.io/library/node:20-alpine
WORKDIR /build
# 设置npm镜像
RUN npm config set registry https://registry.npmmirror.com
COPY package.json /build/package.json
COPY package-lock.json /build/package-lock.json
RUN npm ci --no-audit --no-fund
COPY ./ /build
RUN npm run build

FROM m.daocloud.io/docker.io/library/nginx:stable-alpine
RUN mkdir /app
COPY --from=0 /build/dist /app
COPY --from=0 /build/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
