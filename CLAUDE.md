# CLAUDE.md

本文件为 AI 编码助手提供本项目（乌东文旅"衣食住行"综合服务平台）的上下文与开发约定，生成/修改代码前请先阅读。

## 项目简介

乌东村（贵州黔东南苗寨）文旅综合服务平台，以"衣、食、住、行、社区"为业务主线，覆盖游客从内容种草、社区分享，到商品/餐饮/住宿/门票预订、订单管理，以及商家与平台运营后台的全链路。项目仅供学习交流。

## 技术栈

| 端 | 技术 | 端口 |
| --- | --- | --- |
| 后端服务（所有业务模块共用） | cool-admin-midway（Midway + TypeORM + MySQL） | 8001 |
| C端前端 | wu_dong_vue（Vue 3 + Vite + TS） | 5173 |
| 管理后台前端 | cool_admin_vue（cool-admin-vue 8.x） | 9000 |

- Node.js >= 18，包管理器统一使用 **npm**（不要使用 pnpm / yarn / bun）。
- 端口规划已收敛为 8001 / 5173 / 9000，原 6664~6669 多端口方案已废弃，不要再引入。
- 架构为 **单服务 + 按目录分模块** 的模块化单体，不要按微服务拆分独立进程。

## 目录结构

```
WuDongProject/
├── app/
│   ├── cool-admin-midway/      # 后端服务（端口 8001），业务模块在 src/modules/ 下
│   ├── wu_dong_vue/            # C端前端（端口 5173）
│   └── cool_admin_vue/         # 管理后台前端（端口 9000）
├── docx/                       # 项目文档（设计文档、TODO、技术开发规范等）
├── exp/                        # 实验模块（Demo 代码）
├── libs/                       # 公共工具类
├── scripts/
│   └── sql/wudong_schema.sql   # 业务库 DDL（41 张表）
└── README.md
```

## 常用命令

```bash
# 后端（需先启动 MySQL；连接配置见 app/cool-admin-midway/.env）
cd app/cool-admin-midway && npm install && npm run dev
# 接口：http://127.0.0.1:8001 ，Swagger：http://127.0.0.1:8001/swagger/ui

# C端前端
cd app/wu_dong_vue && npm install && npm run dev
# 访问：http://localhost:5173

# 管理后台前端（依赖后端先启动）
cd app/cool_admin_vue && npm install && npm run dev
# 访问：http://localhost:9000 ，默认账号 admin / 123456
```

## 后端模块划分（src/modules）

业务模块按目录划分，一人负责一个目录：

| 目录 | 业务 | 表前缀 |
| --- | --- | --- |
| base | 平台基础：菜单、权限、系统配置（框架自带） | cool_* |
| user | C端用户：登录、地址、微信 | wudong_common_* |
| m1-goods | 衣：商品/特产、SKU、购物车 | wudong_m1_* |
| m2-meal | 食：餐饮时段与余量 | wudong_m2_* |
| m3-lodging | 住：房型与房态日历 | wudong_m3_* |
| m4-ticket | 行：门票票档与库存 | wudong_m4_* |
| m5-community | 社区：帖子、收藏、评价 | wudong_m5_* |
| order | 公共订单链路：checkout → order → payment → order_event | wudong_common_* |

> 规划中的 m1-goods ~ m5-community、order 目录尚未创建，新建时必须按上表命名落位；框架自带 demo/dict/plugin/recycle/space/swagger/task 等目录不要改动。

## 模块边界约定（必须遵守）

1. **目录即边界**：只修改自己负责的 `src/modules/mX-*` 目录内的 controller / service / entity / config。
2. **公共能力下沉**：用户鉴权（user）、订单支付库存通用逻辑（order）、通用工具放公共模块，业务模块只调用不修改。
3. **跨模块只走 Service**：模块间通过注入对方 Service 调用（如 m2 特产复用 m1 商品服务），禁止直接读写其他模块的表和 SQL。
4. **分支配合**：各模块在自己的分支开发（如 `feat/m1-goods`），冲突局限在自己模块内。

## 数据库约定

- MySQL 连接配置见 `app/cool-admin-midway/.env`（本机 127.0.0.1:3306，root）。
- 业务表 DDL 见 `scripts/sql/wudong_schema.sql`，库名 `wudong`，共 41 张表，命名 `wudong_{common|m1|m2|m3|m4|m5}_*`，字符集 utf8mb4_general_ci。
- 商品收敛为一张 `wudong_m1_product`（module=GOODS|SPECIALTY 区分），m2 特产经 m1 接口读写。
- 收藏/评价为多态表（target_type + target_id），target_type 取值：GOODS/SPECIALTY/RESTAURANT/HOMESTAY/ROUTE/POST。
- 订单链路：checkout(拆单) → order(快照) + order_item + payment + order_event(异步投递) + mX_order_ext(各模块预订参数)。
- 库存粒度：购物车/商品=m1_sku；餐饮余量=m2_slot_quota(按日期)；住宿=m3_room_calendar(date,stock,price_delta)；门票=m4_ticket.stock。
- 枚举存 VARCHAR，取值与前端字符串字面量一致（订单状态 UNPAID/PAID/...；业务类型 GOODS/MEAL/LODGING/TICKET/ROUTE）。
- 金额 DECIMAL(10,2)、评分 DECIMAL(2,1)、逻辑删除用 deleted_at、验证码走 Redis 不建表。

## 前端注意事项

- C端当前数据来自本地 Mock（`src/mock/server.ts`），`/api` 代理目前指向 `http://localhost:8000`，联调后端时需改为 8001。
- 管理后台 `/dev` 前缀请求已代理到 `http://127.0.0.1:8001`。
- 前端类型定义（如 types.ts）与数据库枚举值保持一致，改动需两端同步。

## Git 分支规则

- 主分支：`main`；开发分支：`dev`
- 特征分支：`feat/`；修复分支：`fix/`；合成分支：`lanub/`

## 禁止事项

- 不要使用 npm 以外的包管理器，不要在代码中硬编码 6664~6669 等已废弃端口。
- 不要引入 Python/FastAPI 等第二套后端技术栈，后端统一 cool-admin-midway。
- 不要修改 `scripts/sql/wudong_schema.sql` 的既有表结构；如需变更先与团队确认。
- 不要跨目录修改他人模块，公共模块（base/user/order）的修改需谨慎并说明理由。
- 不要主动创建 README/文档文件，除非用户明确要求。
