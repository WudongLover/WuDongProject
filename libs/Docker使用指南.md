# Docker 使用指南

> 适用环境:Windows 11 + Docker Desktop(WSL2 后端),项目 = WuDongProject(MySQL / Redis / cool-admin-midway / cool_admin_vue / wu_dong_vue)。
> 编排文件见同目录 [`docker-compose.yml`](docker-compose.yml)。
> 文中标注 **【本机】** 的部分是个人开发机配置,换机器请忽略。

---

## 目录

1. [基础概念(30 秒版)](#1-基础概念30-秒版)
2. [本机环境说明](#2-本机环境说明)
3. [命令速查表](#3-命令速查表)
4. [启动项目开发环境](#4-启动项目开发环境)
5. [日常操作](#5-日常操作)
6. [数据备份与清理](#6-数据备份与清理)
7. [常见问题排查](#7-常见问题排查)

---

## 1. 基础概念(30 秒版)

| 概念 | 类比 | 说明 |
|---|---|---|
| **镜像 Image** | 安装包/光盘 | 只读模板,如 `mysql:8.0` |
| **容器 Container** | 运行中的程序实例 | 由镜像创建,可启停、可删,内部改动不持久 |
| **卷 Volume / 挂载** | 移动硬盘 | 数据持久化到宿主机,删容器不丢 |
| **Compose** | 一键启动脚本 | 用 YAML 定义多容器,一次 `up` 全部拉起 |

一句话:**镜像烧录出容器,容器里跑服务,数据放卷里。**

## 2. 本机环境说明

- **【本机】引擎启动**:Docker Desktop 不开机自启,要用前先启动(开始菜单搜 "Docker Desktop",或命令行):

  ```bash
  "E:/AI-code/docker/app/Docker Desktop.exe"
  docker version --format '{{.Server.Version}}'   # 打印出版本号 = 引擎就绪
  ```

  图标缩到托盘不等于退出;右键托盘鲸鱼 → **Quit Docker Desktop** 才真正停止,也可 `docker desktop stop`(省内存)。

- **【本机】docker 命令**:安装时已加入用户 PATH,**新开的终端**(PowerShell / CMD / Git Bash)里直接可用;如果提示 `command not found` / 找不到命令,关掉旧窗口重开,或用全路径 `E:\AI-code\docker\app\resources\bin\docker.exe`。
- **【本机】拉镜像需要代理**:本机网络无法直连 Docker Hub(registry-1.docker.io)。`docker pull` 卡住或报 `i/o timeout` / `TLS handshake` 时,先确认代理/VPN 是否开启;不开代理可考虑后续配置国内镜像加速器。
- **【本机】磁盘**:引擎自身数据在 C 盘 `%LOCALAPPDATA%\Docker\wsl\`(随镜像体积增长,见第 6 节清理);项目数据在 `libs\data\`,不占 C 盘。

## 3. 命令速查表

```bash
# ===== 镜像 =====
docker images                     # 本地镜像列表
docker pull nginx                 # 拉取镜像
docker rmi nginx                  # 删除镜像

# ===== 容器(单容器,不涉及编排时) =====
docker ps                         # 运行中的容器(-a 含已停止)
docker run --rm -it nginx bash    # 起一个临时容器并进入
docker exec -it <容器名> bash     # 进入运行中的容器
docker logs -f <容器名>           # 跟踪日志
docker stop <容器名> && docker rm <容器名>

# ===== Compose(本项目用这个,见第 4 节) =====
docker compose up -d              # 启动全部服务(后台)
docker compose ps                 # 查看编排内各服务状态
docker compose logs -f midway     # 跟踪某个服务的日志
docker compose down               # 停止并移除容器(数据保留)
```

## 4. 启动项目开发环境

> **务必**在 `libs` 目录下执行(compose 依赖相对路径 `../app/...` 和 `./data/...`):

```bash
cd E:\project\WuDongProject\libs
```

### 4.1 服务一览

| 服务 | 镜像/来源 | 用途 | 对外端口(默认) |
|---|---|---|---|
| `mysql` | `mysql:8.0` | 数据库(库名 `cool`,密码见 .env) | 3306 |
| `redis` | `redis:7-alpine` | 缓存 | 6379 |
| `midway` | `../app/cool-admin-midway` 构建 | 后端 API(端口 8888 由 KOA_PORT 决定) | 8888 |
| `admin` | `../app/cool_admin_vue` 构建 | 管理后台(静态页,nginx 托管) | 9000 |
| `web` | `node:20-alpine` | 商城前端(开发模式,热更新) | 5173 |

### 4.2 首次启动

```bash
docker compose up -d
```

- 首次会**拉取镜像 + 构建 midway/admin**,耗时较长(10 分钟级,取决于网络与机器)。
- 中途想只看进度:

  ```bash
  docker compose logs -f          # 或 docker compose ps 看各服务状态
  ```

- 后端 `midway` 会自动等 `mysql` 健康检查通过后再启动(`depends_on: service_healthy`),顺序不用操心。
- 全部就绪后浏览器访问:
  - 管理后台 `http://localhost:9000`
  - 商城前端 `http://localhost:5173`
  - 后端 API `http://localhost:8888`

### 4.3 日常启动 / 停止

```bash
docker compose up -d              # 拉起全部(已存在的不会重建)
docker compose stop               # 全部暂停(容器还在,数据在)
docker compose down               # 停止并删容器(下次 up 重新建,数据/卷保留)
```

只操作单个服务(如重启后端):

```bash
docker compose restart midway
docker compose up -d mysql redis  # 只起数据库两个
```

### 4.4 改代码后怎么更新

| 改了什么 | 操作 |
|---|---|
| `app/cool-admin-midway` 代码 | `docker compose up -d --build midway` |
| `app/cool_admin_vue` 代码 | `docker compose up -d --build admin` |
| `app/wu_dong_vue` 代码 | **无需操作**——web 是代码挂载进容器跑的 dev 模式,保存即热更新 |
| `app/wu_dong_vue/package.json` | `docker compose restart web`(容器启动时会重新 `npm ci`) |
| 数据库 / 配置文件 / 端口 | 见下方 4.5 |

### 4.5 自定义配置(.env)

编排文件里所有 `${XXX:-默认值}` 都可通过环境变量覆盖,端口冲突、改密码最常用:

1. 在 `libs` 下新建 `.env`(文件本身不进 Git,可用 `.env.example` 存模板):

   ```ini
   MYSQL_ROOT_PASSWORD=你的密码
   MYSQL_DATABASE=cool
   MYSQL_PORT=3307        # 本机 3306 被占用时改这里
   REDIS_PORT=6379
   API_PORT=8888
   ADMIN_PORT=9000
   WEB_PORT=5173
   ```

2. 改完生效:

   ```bash
   docker compose up -d      # 端口/环境变量变更会重建受影响的服务
   ```

> 注意:中途改 `MYSQL_ROOT_PASSWORD` 不会改已初始化库的密码,需要连进 mysql 改或清掉 `data/mysql` 重新初始化(见 6.3)。

## 5. 日常操作

### 5.1 进入容器(调试数据库、缓存)

```bash
# MySQL 客户端
docker compose exec mysql mysql -uroot -pcool_mysql密码

# Redis 客户端
docker compose exec redis redis-cli

# 进后端容器内部看日志/文件
docker compose exec midway sh
docker compose exec web sh
```

### 5.2 连接数据库(本机工具 / Navicat 等)

连接信息 = compose 映射端口 + 账号密码(默认 `root` / 见 `libs/.env`,库名 `cool`):

```
Host: localhost    Port: 3306(或你改的 MYSQL_PORT)
User: root         Password: 见 libs/.env
```

### 5.3 网络互通

- 编排**内部**:服务间用服务名互访,如后端连库用 `MYSQL_HOST: mysql`、端口 `3306`(compose 网络内始终是 3306,与对外映射端口无关)。
- 本机访问容器服务:一律走映射端口(`localhost:3306` / `localhost:5173`…)。

## 6. 数据备份与清理

### 6.1 哪些数据在哪

| 数据 | 位置 | 特性 |
|---|---|---|
| MySQL 数据 | `libs/data/mysql/`(bind 挂载) | `down` 不丢,**连 `down -v` 也不删**(bind 挂载) |
| Redis 数据 | `libs/data/redis/` | 同上 |
| 商城前端 node_modules | 具名卷 `web_node_modules` | **`down -v` 会删除**,下次 up 重新 `npm ci` |

### 6.2 备份

```bash
# 方式一(推荐,逻辑备份,可单库)
docker compose exec mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" cool' > backup_cool_$(date +%F).sql

# 方式二(冷备,直接拷贝数据目录,需先停 mysql)
docker compose stop mysql
robocopy libs\data\mysql <备份目标目录> /E
docker compose start mysql
```

### 6.3 重置数据库(密码忘了 / 库被改坏)

```bash
docker compose stop mysql
rm -rf libs/data/mysql          # Windows:先删只读文件可能要 rd /s /q 或解除只读
docker compose up -d mysql      # 会按 .env 重新初始化一个干净的空库
```

### 6.4 磁盘清理

```bash
docker system df                # 查看占用
docker system prune             # 清理已停容器 + 悬空镜像
docker system prune -a          # 狠一点:删所有未使用的镜像(下次用重新拉)
```

**【本机】** 镜像与构建缓存落在 C 盘 Docker 数据目录,C 盘吃紧时 `docker system df` 查、`prune` 清;长期不用的环境 `docker compose down` 后把整个 `libs/data` 归档即可。

## 7. 常见问题排查

| 症状 | 原因与处理 |
|---|---|
| `Error response from daemon: ... i/o timeout` 拉镜像失败 | **【本机】** Docker Hub 被墙:开代理/VPN 后重试,或配国内镜像加速器 |
| `error during connect` / 找不到 daemon | 引擎没启动:见第 2 节启动 Docker Desktop |
| `port is already allocated` | 本机 3306/6379/8888/9000/5173 被占用:`netstat -ano | findstr :3306` 查占用进程;或改 `libs/.env` 端口映射 |
| `web` 启动报 `npm ERR!` | node_modules 卷残留损坏: `docker compose down -v && docker compose up -d web` |
| 后端起来了但接口报 502/连不上库 | 等 mysql 健康后再 `docker compose restart midway`;确认 .env 密码与库一致(见 4.5 注意) |
| `midway` 构建卡在 `npm install` | 容器内 npm 走默认源,国内网络慢/超时:开代理重试,或在 `app/cool-admin-midway/Dockerfile` 里加 `npm config set registry`(阿里源)后重新构建 |
| 修改了 `docker-compose.yml` 不生效 | compose 不自动感知:改完必须重新 `docker compose up -d` |
| 改了 vue/admin 代码,页面没变化 | admin 是构建产物镜像,需 `--build`(见 4.4);web 热更新偶尔抽风就 `docker compose restart web` |

---

## 附录:PowerShell / CMD 小贴士

- 命令与 Linux 终端基本一致,少数不同:
  - 查看端口占用:`netstat -ano | findstr :8888`
  - 复制/移动:`copy` / `move` / `robocopy`(目录复制用它)
- 在 Git Bash 里挂载当前目录用 `$PWD`(PowerShell 用 `${PWD}` 或 `(Get-Location).Path`)。
