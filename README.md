# 乌东文旅"衣食住行"综合服务平台

乌东村为贵州苗族特色村寨，文旅资源丰富，本平台以"衣食住行"为业务主线，构建一站式数字化服务平台，覆盖游客从内容种草、社区分享、商品/餐饮/住宿/门票预订到订单管理、平台运营的全链路。

## 项目背景

乌东村是贵州黔东南苗族侗族自治州特色苗寨，拥有苗族银饰锻造、蜡染刺绣、苗家长桌宴、特色民宿、苗寨梯田与节庆文化等文旅资源。现有运营以线下为主，缺乏统一的线上服务入口。本平台旨在为游客、商家、平台运营方提供完整的数字化解决方案。

## 项目目标

1. 为游客提供一站式"衣、食、住、行、社区"线上服务
2. 为商家提供订单、商品/房源/票务/座位管理后台
3. 为平台运营方提供用户管理、数据看板、内容审核能力
4. 沉淀乌东文旅数字化资产，支撑后续 AI 智能体接入与商业化扩展

## 目录结构

```
WuDongProject/
├── app/                        # 服务模块
│   ├── wu_dong_vue/            # C端前端 - 乌东文旅门户（Vue 3 + Vite + TS，端口 5173）
│   ├── cool_admin_vue/         # 管理后台前端（cool-admin-vue 8.x，端口 9000）
│   └── cool-admin-midway/      # 管理后台后端（Midway + TypeORM + MySQL，端口 8001）
├── docx/                       # 项目文档（设计文档、TODO、技术开发规范等）
├── exp/                        # 实验模块（Demo 代码，用于测试新功能）
├── libs/                       # 公共工具类（日期、字符串等通用工具）
├── scripts/                    # 脚本文件（数据库迁移、测试脚本等）
└── README.md
```

> 衣/食/住/行/社区 5 个业务模块采用单服务 + 目录分模块架构，在 `cool-admin-midway/src/modules/` 下按 `m1-goods` ~ `m5-community` 划分，模块边界与数据表对照见 [app/README.md](app/README.md)。

## 环境要求

- Node.js >= 18
- MySQL >= 5.7（管理后台后端使用）
- 包管理器统一使用 npm

## 模块启动

### 1. C端前端 wu_dong_vue（端口 5173）

```bash
cd app/wu_dong_vue
npm install
npm run dev
```

访问 http://localhost:5173 。当前数据来自本地 Mock（`src/mock/server.ts`），`/api` 已代理到 `http://localhost:8000`，后续 FastAPI 后端就绪后可无缝切换。

### 2. 管理后台后端 cool-admin-midway（端口 8001）

需先准备 MySQL：创建数据库 `cool`（首次启动自动建表并导入初始数据）。

```sql
CREATE DATABASE cool DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

数据库连接、服务端口等配置在 `app/cool-admin-midway/.env` 中（模板见 `.env.example`）：

```env
KOA_PORT=8001
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=你的密码
MYSQL_DATABASE=cool
```

启动：

```bash
cd app/cool-admin-midway
npm install
npm run dev
```

启动后接口地址为 http://127.0.0.1:8001 ，Swagger 文档见 http://127.0.0.1:8001/swagger/ui 。

### 3. 管理后台前端 cool_admin_vue（端口 9000）

依赖后端 cool-admin-midway（需先启动）。

```bash
cd app/cool_admin_vue
npm install
npm run dev
```

访问 http://localhost:9000 ，默认账号 `admin / 123456`。`/dev` 前缀请求已代理到 `http://127.0.0.1:8001`。

## git分支规则

- 主分支：`main`
- 开发分支：`dev`
- 特征分支：`feat/`
- 修复分支：`fix/`
- 合成分支：`lanub/`


## 许可证

本项目仅供学习交流使用。
