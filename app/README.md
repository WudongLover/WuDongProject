# app 服务模块

采用 **单服务 + 按目录分模块** 的模块化单体架构：衣/食/住/行/社区 5 个业务模块与平台后台共用一个后端服务，在 `src/modules/` 目录上按业务边界区分，各由不同成员负责开发；前端统一为 C 端与管理后台两个模块。

## 目录结构

```
app/
├── cool-admin-midway/        # 后端服务（Midway + TypeORM + MySQL，端口 8001）
│   └── src/modules/
│       ├── base/             # 平台基础：菜单、权限、系统配置（后台端）
│       ├── user/             # C端用户：登录、地址、微信
│       ├── m1-goods/         # 衣：商品/特产、SKU、购物车
│       ├── m2-meal/          # 食：餐饮时段与余量
│       ├── m3-lodging/       # 住：房型与房态日历
│       ├── m4-ticket/        # 行：门票票档与库存
│       ├── m5-community/     # 社区：帖子、收藏、评价
│       └── order/            # 公共订单链路：checkout → order → payment → order_event
├── wu_dong_vue/              # C端前端（Vue 3 + Vite + TS，端口 5173）
└── cool_admin_vue/           # 管理后台前端（cool-admin-vue 8.x，端口 9000）
```

## 端口规划

| 模块 | 端口 |
| --- | --- |
| 后端服务（所有业务模块共用） | 8001 |
| C端前端 wu_dong_vue | 5173 |
| 管理后台前端 cool_admin_vue | 9000 |

> 原规划的 6664~6669 多端口独立后端方案已废弃，改为单服务 + 目录分模块。

## 模块边界约定

1. **目录即边界**：一人认领一个 `src/modules/mX-*` 目录，只修改自己目录内的 controller / service / entity / config。
2. **公共能力下沉**：用户鉴权（user）、订单支付库存（order）等放公共模块，业务模块只调用不修改。
3. **跨模块只走 Service**：模块间通过注入对方 Service 调用（如 m2 特产复用 m1 商品服务），不直接读写对方模块的表与 SQL。
4. **分支配合**：`feat/m1-goods`、`feat/m2-meal` 各自开分支，冲突局限在自己模块内。

## 模块与数据表对照

DDL 见 `scripts/sql/wudong_schema.sql`，模块与表前缀一一对应：

| 模块 | 表前缀 | 说明 |
| --- | --- | --- |
| m1-goods | wudong_m1_* | 商品/特产/SKU/购物车 |
| m2-meal | wudong_m2_* | 餐饮时段余量 |
| m3-lodging | wudong_m3_* | 房型/房态日历 |
| m4-ticket | wudong_m4_* | 门票票档库存 |
| m5-community | wudong_m5_* | 帖子/收藏/评价 |
| 公共 | wudong_common_* | 用户/订单/支付等多态表 |
