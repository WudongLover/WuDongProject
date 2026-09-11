FROM node:20-alpine
WORKDIR /build
# 设置npm镜像
RUN npm config set registry https://registry.npmmirror.com
# 同时拷贝 lockfile，npm ci 跳过依赖解析、按锁文件精确安装
COPY package.json package-lock.json /build/
# BuildKit 缓存挂载：跨构建复用 npm 下载缓存，第二次构建起几乎免下载
RUN --mount=type=cache,target=/root/.npm npm ci
COPY ./ /build
RUN npm run build

# Docker Hub 直连失败时改用国内镜像源（已实测可用）
FROM docker.m.daocloud.io/library/nginx:alpine
RUN mkdir /app
COPY --from=0 /build/dist /app
COPY --from=0 /build/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
