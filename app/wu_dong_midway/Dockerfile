FROM node:20-alpine

WORKDIR /app

# 配置 alpine 国内镜像加速
RUN sed -i "s@http://dl-cdn.alpinelinux.org/@https://repo.huaweicloud.com/@g" /etc/apk/repositories

# 安装 tzdata（alpine 默认不含时区组件），TZ 可用 compose/run 覆盖
RUN apk add --no-cache tzdata

# 默认时区东八区
ENV TZ="Asia/Shanghai"

# 私有源可替换；官方源时注释下一行
RUN npm config set registry https://registry.npmmirror.com

# 先安装依赖（含构建所需 devDependencies），善用构建缓存
COPY package.json package-lock.json ./
# BuildKit 缓存挂载：跨构建复用 npm 下载缓存
RUN --mount=type=cache,target=/root/.npm npm ci

# 拷贝源码并编译 TS -> dist（bootstrap.js 引用 dist/configuration）
COPY . .
RUN npm run build

# 移除开发期依赖，仅保留生产依赖
RUN npm prune --omit=dev

ENV NODE_ENV=production

# 端口如更换请同步更新
EXPOSE 8001

CMD ["npm", "run", "start"]
