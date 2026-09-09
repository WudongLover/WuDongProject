# m3-lodging 住宿模块

## 模块说明

本模块负责民宿、房型、房态的管理，包括民宿信息的 CRUD 操作。

## 目录结构

```
m3-lodging/
├── config.ts                          # 模块配置
├── entity/
│   └── homestay.ts                    # 民宿实体
├── controller/
│   └── admin/
│       └── homestay.ts                # 民宿管理接口
├── service/
│   └── homestay.ts                    # 民宿服务
├── seed/
│   └── homestay.ts                    # 种子数据
└── README.md                          # 本文件
```

## 接口说明

### 民宿管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /admin/m3/homestay/page | 分页查询 |
| GET | /admin/m3/homestay/info/:id | 单点查询 |
| GET | /admin/m3/homestay/list | 列表查询 |
| POST | /admin/m3/homestay/add | 添加民宿 |
| PUT | /admin/m3/homestay/update | 更新民宿 |
| DELETE | /admin/m3/homestay/delete | 逻辑删除 |

### 查询参数

- `page` - 页码（默认：1）
- `pageSize` - 每页数量（默认：20）
- `keyword` - 关键词搜索（名称、地址）
- `status` - 状态筛选（ENABLED/DISABLED）
- `merchantId` - 商家ID筛选

## 数据库表

本模块对应数据库表：`wudong_m3_homestay`

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| merchantId | BIGINT | 商家ID |
| name | VARCHAR(128) | 民宿名称 |
| cover | VARCHAR(500) | 封面图 |
| images | JSON | 图片列表 |
| rating | DECIMAL(2,1) | 评分 |
| score | JSON | 评分明细 |
| tags | JSON | 标签 |
| facilities | JSON | 设施列表 |
| address | VARCHAR(255) | 地址 |
| intro | VARCHAR(2000) | 简介 |
| notice | TEXT | 入住须知 |
| status | VARCHAR(16) | 状态（ENABLED/DISABLED） |
| deletedAt | DATETIME | 删除时间（逻辑删除） |

## 使用方法

### 1. 启动后端服务

```bash
cd app/cool-admin-midway
npm install
npm run dev
```

### 2. 初始化种子数据

```typescript
// 在测试脚本中调用
const seed = await ctx.requestContext.getAsync(M3HomestaySeed);
const result = await seed.initSeed();
console.log(result);
```

### 3. 测试接口

```bash
# 分页查询
curl http://localhost:8001/admin/m3/homestay/page

# 单点查询
curl http://localhost:8001/admin/m3/homestay/info/1

# 添加民宿
curl -X POST http://localhost:8001/admin/m3/homestay/add \
  -H "Content-Type: application/json" \
  -d '{"name":"测试民宿","cover":"https://example.com/cover.jpg","address":"测试地址"}'

# 逻辑删除
curl -X DELETE http://localhost:8001/admin/m3/homestay/delete?ids=1
```

## 注意事项

1. 逻辑删除：删除操作会自动设置 `deletedAt` 字段，不会物理删除数据
2. 商家隔离：后续需要根据登录用户的身份，限制只能操作自己商家的民宿
3. 图片上传：当前使用 URL，后续需要接入上传接口
