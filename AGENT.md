# AGENT.md

本文件面向各类 AI 编码代理（通用版），提供本项目的上下文、约定与操作边界。执行任务前请先阅读。

## 项目简介

乌东村（贵州黔东南苗寨）文旅综合服务平台，以"衣、食、住、行、社区"为业务主线，覆盖游客从内容种草、社区分享，到商品/餐饮/住宿/门票预订、订单管理，以及商家与平台运营后台的全链路。项目仅供学习交流。

## 技术栈与端口

| 端 | 技术 | 端口 |
| --- | --- | --- |
| C端后端 | wu_dong_midway（纯 Midway v3 + TypeORM + MySQL） | 6666 |
| 管理后台后端 | cool-admin-midway（Cool Admin + Midway + TypeORM + MySQL） | 8001 |
| C端前端 | wu_dong_vue（Vue 3 + Vite + TS） | 5173 |
| 管理后台前端 | cool_admin_vue（cool-admin-vue 8.x） | 9000 |

- Node.js >= 18，包管理器统一使用 **npm**（不要使用 pnpm / yarn / bun）。
- 端口规划为 6666 / 8001 / 5173 / 9000，不要引入其他端口。
- 后端为两个独立服务：C端业务在 wu_dong_midway（6666），管理后台在 cool-admin-midway（8001）。

## 目录结构

```
WuDongProject/
├── .rules/                     # 团队协作规则（编辑器/AI 辅助规则等）
├── app/
│   ├── wu_dong_midway/         # C端后端服务（端口 6666，纯 Midway v3）
│   │   ├── .env                # MySQL 连接与端口配置
│   │   └── src/
│   │       ├── config/         # 环境配置
│   │       └── modules/        # C端业务模块（m1-goods / m2-meal / m3-lodging / m4-ticket / m5-community / order / user）
│   ├── cool-admin-midway/      # 管理后台后端（端口 8001，Cool Admin）
│   │   ├── .env                # MySQL 连接与端口配置
│   │   └── src/
│   │       ├── comm/           # 公共工具：path.ts / port.ts / utils.ts
│   │       ├── config/         # 环境配置
│   │       └── modules/        # 后台模块（框架自带为主）
│   │           ├── base/       # 平台基础（框架自带，不改动）
│   │           ├── user/       # 用户（框架自带）
│   │           ├── m3-lodging/ # 住（已有代码）
│   │           ├── m4-ticket/  # 行（已有代码）
│   │           └── dashboard/ dict/ demo/ plugin/ recycle/ space/ swagger/ task/
│   ├── wu_dong_vue/            # C端前端（端口 5173，Vue 3 + Vite + TS，代理 → localhost:6666）
│   │   └── src/
│   │       ├── api/            # 接口请求（统一走此层，禁止裸写 axios）
│   │       ├── components/     # 公共组件
│   │       ├── mock/           # 本地 Mock 数据（server.ts）
│   │       ├── router/         # 路由
│   │       ├── stores/         # Pinia 状态
│   │       ├── styles/         # 全局样式
│   │       └── views/          # 页面视图
│   └── cool_admin_vue/         # 管理后台前端（端口 9000，cool-admin-vue 8.x，代理 → localhost:8001）
│       └── src/
│           ├── config/         # 全局配置
│           ├── cool/           # 框架核心（bootstrap/router/service/utils...）
│           ├── modules/        # 后台功能模块（base/demo/dict/helper/recycle/space/task/user）
│           └── plugins/        # 插件
├── docx/                       # 项目文档（设计文档、TODO、技术开发规范等）
├── exp/                        # 实验模块（Demo 代码）
├── libs/                       # 公共工具类
├── scripts/
│   └── sql/wudong_schema.sql   # 业务库 DDL（41 张表，库名 wudong）
├── CLAUDE.md                   # AI 助手上下文（项目专用）
├── AGENT.md                    # 通用 AI 代理上下文（本文件）
└── README.md
```

## 常用命令

```bash
# C端后端（需先启动 MySQL；连接配置见 app/wu_dong_midway/.env）
cd app/wu_dong_midway && npm install && npm run dev
# 访问：http://localhost:6666

# 管理后台后端（连接配置见 app/cool-admin-midway/.env）
cd app/cool-admin-midway && npm install && npm run dev
# 接口：http://127.0.0.1:8001 ，Swagger：http://127.0.0.1:8001/swagger/ui

# C端前端
cd app/wu_dong_vue && npm install && npm run dev
# 访问：http://localhost:5173

# 管理后台前端（依赖后端先启动）
cd app/cool_admin_vue && npm install && npm run dev
# 访问：http://localhost:9000 ，默认账号 admin / 123456
```

## 后端模块划分

### C端业务模块（src/modules，wu_dong_midway）

| 目录 | 业务 | 表前缀 |
| --- | --- | --- |
| user | C端用户：登录、地址、微信 | wudong_common_* |
| m1-goods | 衣：商品/特产、SKU、购物车 | wudong_m1_* |
| m2-meal | 食：餐饮时段与余量 | wudong_m2_* |
| m3-lodging | 住：房型与房态日历 | wudong_m3_* |
| m4-ticket | 行：门票票档与库存 | wudong_m4_* |
| m5-community | 社区：帖子、收藏、评价 | wudong_m5_* |
| order | 公共订单链路：checkout → order → payment → order_event | wudong_common_* |

### 管理后台模块（src/modules，cool-admin-midway）

| 目录 | 说明 |
| --- | --- |
| base | 平台基础：菜单、权限、系统配置（框架自带，不改动） |
| user | 管理端用户（框架自带） |
| m3-lodging / m4-ticket | 住/行模块（已有代码） |
| 其他 | dashboard / dict / demo / plugin / recycle / space / swagger / task（框架自带） |

## 模块内部分层（必须遵守）

每个业务模块内部固定四层，禁止跨层乱调：

```
mX/
├── config.ts                  # 模块注册
├── entity/                    # TypeORM 实体（仅本模块表）
├── dto/                       # class-validator 入参/出参 DTO
├── controller/{app,admin}/    # 薄层：参数绑定/校验 + 调用 service
└── service/                   # 业务逻辑（可注入 common，不可依赖其他业务模块）
```

⚠️ 禁止：跨层乱调、缺少 dto 层、Controller 直接注入 Repository

## 模块边界约定（必须遵守）

1. **目录即边界**：只修改自己负责的模块目录内的 controller / service / entity / dto / config。
2. **公共能力下沉**：用户鉴权、订单支付库存通用逻辑、通用工具放公共模块，业务模块只调用不修改。
3. **跨模块只走 Service**：模块间通过注入对方 Service 调用（如 m2 特产复用 m1 商品服务），禁止直接读写其他模块的表和 SQL。
4. **分支配合**：各模块在自己的分支开发（如 `feat/m1-goods`），冲突局限在自己模块内。

## API 设计规范

- 风格：RESTful；前缀统一 `/api/v1/{...}/...`
- 分页统一使用 `page`、`page_size`，默认 20、最大 100；时间 ISO 8601；金额用字符串
- 统一响应体：`{ "code": 0, "message": "ok", "data": {} }`；列表分页：`{ "items": [], "page": 1, "page_size": 20, "total": 128 }`
- 错误码：0=成功，1xxx=公共基础，2xxx=用户认证，3xxx=订单，4xxx=支付，5xxx=购物车，6xxx=上传审核，71xx-75xx=模块1-5，9xxx=系统
- 全部接口必须有：DTO 入参/出参模型、Swagger 描述、至少一个 example
- 写操作支持 `Idempotency-Key`；响应带 `X-Request-ID`

## 认证鉴权架构

- 请求头 `Authorization: Bearer <JWT>`；JWT 有效期 2h，过期后走刷新接口
- refresh token 通过 HttpOnly + Secure + SameSite Cookie 传输；access token 仅存前端内存，禁止 localStorage
- 模块接口需要用户身份时**一律使用统一鉴权依赖**，禁止自行解析 token

## 数据库约定

- MySQL 连接配置见各自 `.env` 文件；`.env` 不入库，只提交 `.env.example`
- 业务表 DDL 见 `scripts/sql/wudong_schema.sql`，库名 `wudong`，共 41 张表，命名 `wudong_{common|m1|m2|m3|m4|m5}_*`，字符集 utf8mb4_general_ci
- 商品收敛为一张 `wudong_m1_product`（module=GOODS|SPECIALTY 区分），m2 特产经 m1 接口读写
- 收藏/评价为多态表（target_type + target_id），target_type 取值：GOODS/SPECIALTY/RESTAURANT/HOMESTAY/ROUTE/POST
- 订单链路：checkout(拆单) → order(快照) + order_item + payment + order_event(异步投递) + mX_order_ext(各模块预订参数)
- 库存粒度：购物车/商品=m1_sku；餐饮余量=m2_slot_quota(按日期)；住宿=m3_room_calendar(date,stock,price_delta)；门票=m4_ticket.stock
- 枚举存 VARCHAR，取值与前端字符串字面量一致（订单状态 UNPAID/PAID/...；业务类型 GOODS/MEAL/LODGING/TICKET/ROUTE）
- 金额 DECIMAL(10,2)、评分 DECIMAL(2,1)、逻辑删除用 deleted_at、验证码走 Redis 不建表
- 表结构变更通过 TypeORM migration 提交，禁止手工改表

## 安全规范

- 密码：bcrypt（cost = 12），禁止明文/可逆加密
- SQL：全部走 TypeORM 参数化查询，禁止字符串拼接 SQL
- XSS：富文本服务端白名单标签过滤；前端 v-html 前二次消毒
- 越权：查询/操作带 user_id、merchant_id 的资源时必须校验归属
- 上传安全：扩展名白名单 + 文件头魔数校验 + 大小限制；文件随机命名
- 密钥：JWT_SECRET、数据库密码等放 .env，不入库
- 限流：登录/验证码/支付/退款/上传接口按 IP、用户和手机号组合限流

## 编码规范

- 开启严格类型；DTO、Entity、Service 的公开方法必须声明类型
- 禁止 `any`、空 `catch`、`console.log`（使用 Midway Logger）
- 模块间依赖方向：业务模块 → 公共模块，禁止反向
- 提交前本地必须通过 lint 与 test
- ESLint + Prettier 统一规则；Vue 组件用 `<script setup lang="ts">`

## 第三方服务抽象层

业务模块一律面向抽象接口编程，禁止直接 import mock 实现类；切换真实服务只改配置不改业务代码。

## 前端规范

- 页面内**禁止裸写 axios 调用**，统一走 API 层
- 前端类型定义与数据库枚举值保持一致，改动需两端同步
- Pinia store 按模块拆分；登录态/用户信息用共享 store
- 主站全部页面必须适配移动端（响应式断点：<768 移动、768-1280 平板、≥1280 桌面）

## 测试规范

- 单模块覆盖率 ≥ 60%（验收硬指标）
- 公共服务覆盖率 ≥ 80%

## Git 分支规则

- 主分支：`main`；开发分支：`dev`
- 特征分支：`feat/`；修复分支：`fix/`；合成分支：`lanub/`
- 提交信息：Conventional Commits，示例 `feat(m1): 商品详情与加购`、`fix(common): 支付幂等`

## 操作边界（禁止事项）

- 不要引入 Python/FastAPI 等第二套后端技术栈
- 不要修改 `scripts/sql/wudong_schema.sql` 的既有表结构；如需变更先与团队确认
- 不要跨目录修改他人模块，公共模块的修改需谨慎并说明理由
- 不要主动创建 README/文档文件，除非用户明确要求
- 提交代码前确认改动仅限自己负责的模块目录
- 每次任务做到最小修改
