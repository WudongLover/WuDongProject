# 乌东文旅 C 端 LangChain 智能体方案

> 版本：v0.1（Plan 阶段，仅设计不执行）
> 日期：2026-09-10
> 适用项目：WuDongProject（乌东文旅"衣食住行"综合服务平台）

---

## 1. 背景与目标

### 1.1 项目现状

乌东文旅平台已建成 C 端 Vue3 SPA + MidwayJS 后端，覆盖五大业务模块：

| 模块 | 内容 | 后端状态 |
|---|---|---|
| m1-goods（衣） | 银饰、蜡染、苗绣、苗族服饰、特产 | 已接真实后端 |
| m2-meal（食） | 长桌宴、火塘腊味、高山特产、雷山银球茶 | 前端 Mock |
| m3-lodging（住） | 苗寨民宿 | 已接真实后端 |
| m4-ticket（行） | 景区门票、旅游路线 | 已接真实后端 |
| m5-community（社区） | 游记分享、点赞评论 | 已接真实后端 |

辅助能力：用户认证、订单、购物车、收藏、消息、文化导览（前端固定内容）。

### 1.2 为什么需要智能体

C 端游客在文旅场景中有大量**非结构化、探索式**需求，现有列表页 + 筛选器的交互模式无法高效满足：

- "我带老人小孩来，3 天 2 晚怎么安排比较轻松？"
- "乌东的银饰和西江的有什么区别？买的时候怎么看真假？"
- "酸汤鱼的酸汤是怎么做的？能买到现成的吗？"
- "我预算 2000，想住特色民宿、吃长桌宴、看梯田，帮我配一下"

这些问题需要**理解意图 → 检索知识/数据 → 综合推理 → 给出可操作建议**，正是 LLM 智能体的适用场景。

### 1.3 目标

在不侵入现有业务模块的前提下，接入一个面向 C 端游客的 LangChain 智能体，首期实现：

1. **文旅问答**：乌东村概况、苗族文化、衣食住行知识解答
2. **行程规划**：根据天数/预算/偏好生成可落地的游玩路线
3. **商品/服务推荐**：结合用户描述推荐平台内商品、民宿、餐饮、路线
4. **智能客服**：订单、预订、支付等常见问题自动解答

---

## 2. 智能体定位与边界

### 2.1 定位

**"乌东文旅小助手"**——嵌入 C 端页面的对话式助手，定位为**导购 + 导览 + 客服**的结合体，而非通用聊天机器人。

### 2.2 能力边界

| 能做 | 不做 |
|---|---|
| 回答乌东/苗族文化相关问题 | 通用闲聊、与文旅无关的话题 |
| 推荐平台内商品/民宿/餐饮/路线 | 推荐平台外的第三方商家 |
| 生成行程规划建议 | 直接替用户下单/支付 |
| 解答订单/预订流程问题 | 处理退款、投诉等需人工介入的操作 |
| 解释文化典故、工艺知识 | 编造不存在的景点/商品/历史 |

### 2.3 安全约束

- 所有推荐必须来自平台真实数据（通过 Tool 查询），禁止幻觉编造商品
- 涉及价格、库存、房态等实时信息，必须调用 Tool 获取，不依赖训练数据
- 用户隐私数据（手机号、地址、订单详情）不在对话中明文展示
- 输出内容经过敏感词过滤（复用现有 m5-community 的敏感词能力）

---

## 3. 技术选型

### 3.1 为什么选 LangChain JS 而非 Python

| 维度 | LangChain JS（@langchain/core） | Python LangChain |
|---|---|---|
| 技术栈一致性 | 与 MidwayJS 同栈，直接 import | 需额外部署 Python 服务 |
| 部署成本 | 集成进现有 Midway 进程或独立 Node 服务 | 需 Python 运行时 + 依赖管理 |
| 团队熟悉度 | 前端/全栈团队可维护 | 需 Python 经验 |
| 生态完整度 | 核心能力齐全（Tool、RAG、Agent） | 生态更丰富，但本项目用不到高级特性 |

**结论**：选用 LangChain JS，与现有 MidwayJS 后端同技术栈，降低运维和协作成本。

### 3.2 核心依赖

```
@langchain/core          # 核心抽象（Message、Tool、Runnable）
@langchain/openai        # OpenAI 兼容模型接入（支持 DeepSeek、通义等国内模型）
@langchain/community     # 社区集成（向量库、文档加载器）
@langchain/textsplitters # 文本切分
```

### 3.3 LLM 模型选择

建议使用 **OpenAI 兼容协议**接入，便于切换：

| 模型 | 适用场景 | 备注 |
|---|---|---|
| DeepSeek-V3 / R1 | 主力推理模型 | 性价比高，中文能力强 |
| 通义千问 Qwen-Plus | 备选 | 阿里生态，文旅知识较丰富 |
| gpt-4o-mini | 轻量任务 | 分类、提取等简单调用 |

通过 `baseURL` + `apiKey` 配置切换，不绑定单一厂商。

### 3.4 向量库

首期使用 **内存向量存储**（`MemoryVectorStore`）做 Demo，数据量小（文化知识文档预计 < 100 篇）。后续如需持久化，可迁移至：

- **Redis**：项目已用 Redis 7，可复用（Redis Stack 支持向量搜索）
- **Chroma / Milvus**：独立向量库，适合数据量增长后

---

## 4. 架构设计

### 4.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│  C 端前端（wu_dong_vue）                                  │
│  ┌──────────────┐                                        │
│  │ 对话浮窗/页面  │  ←  SSE 流式输出                      │
│  └──────┬───────┘                                        │
└─────────┼───────────────────────────────────────────────┘
          │ POST /api/v1/agent/chat（SSE）
┌─────────▼───────────────────────────────────────────────┐
│  MidwayJS 后端（wu_dong_midway）                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  m6-agent 模块（新增）                              │   │
│  │  ┌────────────┐  ┌──────────┐  ┌────────────┐  │   │
│  │  │ Controller │→│ Agent Svc │→│ LangChain   │  │   │
│  │  │  (SSE)     │  │ (编排/鉴权)│  │ Agent Runtime│ │   │
│  │  └────────────┘  └────┬─────┘  └─────┬──────┘  │   │
│  │                         │                │         │   │
│  │  ┌──────────────────────▼────────────────▼──────┐ │   │
│  │  │  Tools（对接现有业务 Service）                  │ │   │
│  │  │  商品搜索 / 民宿查询 / 路线查询 / 订单查询     │ │   │
│  │  └──────────────────────┬───────────────────────┘ │   │
│  │                         │                           │   │
│  │  ┌──────────────────────▼───────────────────────┐ │   │
│  │  │  RAG 知识库（文化文档 + 平台 FAQ）              │ │   │
│  │  │  文档加载 → 切分 → 向量化 → 检索               │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  现有模块：m1-goods / m2-meal / m3-lodging / m4-ticket │
│           m5-community / order / user（只读调用）         │
└───────────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│  外部依赖                                                  │
│  LLM API（DeepSeek/通义）+ 向量存储 + MySQL（对话记录）   │
└───────────────────────────────────────────────────────────┘
```

### 4.2 模块划分

在 `wu_dong_midway/src/modules/` 下新增 `m6-agent` 模块，遵循现有模块的目录规范：

```
m6-agent/
├── controller/
│   └── agent.controller.ts      # HTTP 入口，SSE 流式输出
├── service/
│   ├── agent.service.ts          # Agent 编排：构建 Chain、管理对话
│   ├── rag.service.ts            # RAG：文档加载、切分、向量化、检索
│   └── session.service.ts        # 对话会话管理（历史记录、过期清理）
├── tools/
│   ├── goods.tools.ts            # 商品搜索/详情 Tool
│   ├── lodging.tools.ts          # 民宿查询 Tool
│   ├── trip.tools.ts             # 路线/景区 Tool
│   ├── meal.tools.ts             # 餐饮查询 Tool（Mock 阶段先查静态数据）
│   └── faq.tools.ts              # 常见问题检索 Tool
├── prompts/
│   ├── system.ts                 # 系统提示词（角色、边界、输出格式）
│   └── trip-planner.ts           # 行程规划专用提示词
├── entity/
│   ├── chat_session.entity.ts    # 对话会话表
│   └── chat_message.entity.ts    # 对话消息表
├── dto/
│   └── chat.dto.ts               # 请求/响应 DTO
└── mapper/
    ├── chat_session.mapper.ts
    └── chat_message.mapper.ts
```

### 4.3 与现有模块的关系

- **只读调用**：Agent 通过 Tool 调用现有 Service 的查询方法（商品列表、民宿详情、路线列表等），不做写入操作
- **不修改现有模块**：m1~m5 代码零改动，Agent 作为消费者接入
- **复用公共能力**：认证（AuthMiddleware）、敏感词过滤、日志、错误处理

---

## 5. 核心能力设计

### 5.1 能力一：文旅问答（RAG）

**场景**：用户问"乌东村有什么好玩的？""苗族银饰是怎么做的？"

**流程**：
1. 用户提问 → 意图识别（是否需要检索）
2. 对问题做向量化 → 在知识库中检索 Top-K 相关文档
3. 检索结果 + 用户问题 → 拼装 Prompt → LLM 生成回答
4. 回答中标注信息来源（如"根据《乌东村志》记载…"）

**知识库内容来源**：
- 现有文化导览内容（`wu_dong_vue/src/mock/culture.ts`，衣/食/住/行四大模块的文化故事）
- 平台 FAQ（订单流程、退改政策、交通指南等，需运营整理）
- 乌东村基础介绍（地理位置、人口、历史、节庆）

### 5.2 能力二：行程规划（Agent + Tool）

**场景**：用户说"我想周末来乌东玩 2 天，带爸妈，预算 1500，喜欢拍照和吃美食"

**流程**：
1. LLM 从用户描述中提取参数：天数=2、人群=带老人、预算=1500、偏好=拍照/美食
2. 调用 Tool 查询：景区列表、民宿列表、餐饮列表、路线推荐
3. LLM 综合推理，生成结构化行程：
   - Day1：上午到达 → 民宿入住 → 午餐 → 下午景点 → 晚餐长桌宴 → 夜景
   - Day2：早餐 → 上午景点 → 午餐 → 购买特产 → 返程
4. 每个推荐项附带平台内链接（可点击跳转商品/民宿/路线详情页）

**输出格式**：Markdown 结构化，包含时间、地点、预估费用、注意事项、跳转链接。

### 5.3 能力三：商品/服务推荐（Tool Use）

**场景**：用户说"我想买个银手镯送妈妈，预算 500 以内，有什么推荐？"

**流程**：
1. LLM 提取搜索条件：类目=银饰、价格≤500、场景=送长辈
2. 调用 `goodsSearch` Tool，传入参数查询商品列表
3. LLM 对返回结果做筛选和排序，生成推荐理由
4. 输出商品卡片（名称、价格、图片、简介、跳转链接）

**适用范围**：商品、民宿、餐饮、路线、景区门票，均通过对应 Tool 查询真实数据。

### 5.4 能力四：智能客服（FAQ + 订单查询）

**场景**：用户问"怎么退款？""我的订单什么时候发货？""民宿可以带宠物吗？"

**流程**：
1. 通用问题（退改政策、支付方式、交通指南等）→ RAG 检索 FAQ 回答
2. 订单相关问题（"我的订单到哪了"）→ 需用户登录 → 调用订单查询 Tool → 返回订单状态
3. 无法回答的问题 → 引导转人工客服（给出客服联系方式或工单入口）

---

## 6. Tool 设计

Tool 是 LangChain Agent 调用外部能力的接口。每个 Tool 包含：名称、描述、输入参数 Schema、执行函数。

### 6.1 Tool 清单

| Tool 名称 | 描述 | 输入参数 | 对接 Service |
|---|---|---|---|
| `search_goods` | 搜索平台商品（银饰/蜡染/特产等） | keyword, category, max_price, sort, page | m1-goods ProductService |
| `get_goods_detail` | 获取商品详情 | product_id | m1-goods ProductService |
| `search_lodging` | 搜索民宿 | keyword, price_range, tags | m3-lodging HomestayService |
| `get_lodging_detail` | 获取民宿详情（含房型） | homestay_id | m3-lodging HomestayService |
| `search_routes` | 搜索旅游路线 | days, theme, max_price | m4-ticket RouteService |
| `get_scenic_list` | 获取景区列表 | - | m4-ticket ScenicService |
| `search_meal` | 搜索餐饮/餐厅 | keyword, signature | m2-meal（Mock → 后续接真实） |
| `get_orders` | 查询当前用户订单 | status, page | order OrderService（需登录） |
| `search_faq` | 检索常见问题 | query | RAG 知识库 |
| `get_culture_story` | 获取文化故事详情 | story_id | 前端文化内容迁移至后端 |

### 6.2 Tool 实现规范

每个 Tool 是一个独立文件，导出 LangChain `tool` 函数：

```typescript
// tools/goods.tools.ts
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { Inject } from '@midwayjs/core'
import { ProductService } from '../../m1-goods/service/product.service'

export function createSearchGoodsTool(productService: ProductService) {
  return tool(
    async ({ keyword, maxPrice, category }) => {
      const result = await productService.page({
        keyword,
        max_price: maxPrice,
        category_id: category,
        page: 1,
        page_size: 5,
      })
      // 精简字段，避免 Token 浪费
      return result.items.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        cover: p.cover,
        summary: p.intro?.slice(0, 80),
      }))
    },
    {
      name: 'search_goods',
      description: '搜索乌东文旅平台的商品，包括银饰、蜡染、苗绣、苗族服饰和特产。当用户询问购买什么商品、推荐纪念品、查找特定类目商品时使用。',
      schema: z.object({
        keyword: z.string().optional().describe('搜索关键词，如"银手镯""蜡染"'),
        maxPrice: z.number().optional().describe('最高价格（元）'),
        category: z.string().optional().describe('类目ID'),
      }),
    }
  )
}
```

### 6.3 Tool 调用约束

- **返回数据精简**：Tool 返回结果只保留 LLM 需要的字段（id、名称、价格、图片、简介），避免大段详情浪费 Token
- **分页限制**：单次查询最多返回 5 条，LLM 可决定是否需要更多
- **错误处理**：Tool 执行失败时返回友好错误信息，LLM 据此决定是否换方式重试或告知用户
- **鉴权透传**：涉及用户数据的 Tool（如订单查询）从请求上下文获取 userId，不允许 LLM 传入任意用户 ID

---

## 7. RAG 知识库设计

### 7.1 知识来源

| 来源 | 内容 | 格式 | 预计篇数 |
|---|---|---|---|
| 文化导览（现有） | 衣/食/住/行四大模块的文化故事 | Markdown/JSON | ~20 篇 |
| 乌东村概况 | 地理位置、历史、人口、节庆、交通 | Markdown | ~5 篇 |
| 平台 FAQ | 订单流程、退改政策、支付方式、入园须知 | Markdown | ~15 篇 |
| 商品/服务说明 | 银饰保养、蜡染工艺说明、民宿入住须知 | Markdown | ~10 篇 |

### 7.2 文档处理流程

```
原始文档（Markdown）
  → 文档加载（TextLoader / DirectoryLoader）
  → 文本切分（RecursiveCharacterTextSplitter，chunk_size=500, overlap=50）
  → 向量化（Embedding 模型：bge-small-zh / text-embedding-3-small）
  → 存入向量库（MemoryVectorStore → 后续 Redis）
  → 检索时：用户问题向量化 → 相似度搜索 Top-K（K=4）→ 重排序
```

### 7.3 知识文档存放

在项目中新增知识文档目录：

```
wu_dong_midway/src/modules/m6-agent/knowledge/
├── culture/            # 文化导览内容
│   ├── yi-silver.md
│   ├── yi-batik.md
│   ├── shi-banquet.md
│   └── ...
├── about/              # 乌东村概况
│   ├── introduction.md
│   ├── transportation.md
│   └── festivals.md
├── faq/                # 常见问题
│   ├── order.md
│   ├── refund.md
│   └── payment.md
└── service/            # 服务说明
    ├── silver-care.md
    └── homestay-notice.md
```

首期可直接从前端 `mock/culture.ts` 迁移文化内容，运营后续补充 FAQ。

---

## 8. 前端接入方案

### 8.1 入口形态

**方案 A：右下角对话浮窗**（推荐首期）
- 固定在页面右下角，点击展开对话面板
- 不占用页面空间，用户随时可唤起
- 适合"问答+推荐"轻量交互

**方案 B：独立助手页面**（后续扩展）
- 路由 `/assistant`，全屏对话界面
- 适合深度行程规划、多轮复杂对话
- 可展示行程卡片、推荐商品列表等富内容

### 8.2 前端组件

```
wu_dong_vue/src/components/agent/
├── AgentChatWidget.vue      # 浮窗入口 + 对话面板
├── AgentMessage.vue          # 单条消息渲染（支持 Markdown、商品卡片）
├── AgentSuggestion.vue       # 推荐问题快捷按钮
└── useAgentChat.ts           # 对话状态管理（SSE 连接、消息列表、历史记录）
```

### 8.3 SSE 流式输出

后端通过 `Content-Type: text/event-stream` 逐 token 推送，前端实时渲染：

```typescript
// useAgentChat.ts
async function sendMessage(content: string) {
  const response = await fetch('/api/v1/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, sessionId }),
  })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    // 解析 SSE 事件，追加到消息
  }
}
```

### 8.4 消息渲染

- 纯文本：Markdown 渲染（支持加粗、列表、链接）
- 商品/民宿卡片：检测到特定格式（如 `[card:product:id]`）时渲染为商品卡片组件
- 行程规划：检测到行程结构时渲染为时间线组件
- 引用来源：回答末尾标注知识来源（可点击展开原文）

### 8.5 快捷推荐问题

对话面板底部展示 3~5 个推荐问题，降低用户输入门槛：
- "乌东有什么必玩景点？"
- "帮我规划 2 天 1 晚的行程"
- "银饰怎么选？有什么推荐？"
- "从贵阳怎么到乌东？"

---

## 9. 对话管理与数据持久化

### 9.1 会话模型

```typescript
// chat_session.entity.ts
@EntityModel('chat_session')
export class ChatSession {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  user_id: number | null  // 未登录用户为 null，用 device_id 标识

  @Column()
  device_id: string  // 未登录用户的设备标识（localStorage 生成 UUID）

  @Column({ length: 100 })
  title: string  // 会话标题，取首条消息前 20 字

  @Column()
  created_at: Date

  @Column()
  updated_at: Date

  @Column({ default: 0 })
  message_count: number
}
```

```typescript
// chat_message.entity.ts
@EntityModel('chat_message')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  session_id: number

  @Column({ type: 'enum', enum: ['user', 'assistant', 'system'] })
  role: string

  @Column({ type: 'text' })
  content: string

  @Column({ type: 'json', nullable: true })
  tool_calls: any[]  // 记录本次调用的 Tool，便于排查

  @Column({ type: 'int', default: 0 })
  prompt_tokens: number

  @Column({ type: 'int', default: 0 })
  completion_tokens: number

  @Column()
  created_at: Date
}
```

### 9.2 历史记录管理

- 每个用户/设备最多保留 **20 条会话**，超出自动删除最旧的
- 单条会话最多保留 **50 条消息**，超出截断最早的（保留系统提示）
- 会话超过 **7 天**无活动自动归档（前端不再展示，数据库保留 30 天后删除）
- 对话历史作为 LLM 上下文传入，最近 **10 轮**（20 条消息）参与推理

### 9.3 Token 用量统计

每次 LLM 调用记录 prompt_tokens 和 completion_tokens，便于：
- 成本核算（按模型单价计算单次对话成本）
- 性能监控（响应时长、Token 消耗趋势）
- 异常检测（单条消息 Token 异常高时告警）

---

## 10. 提示词设计

### 10.1 系统提示词（System Prompt）

```
你是"乌东文旅小助手"，专门为到访贵州黔东南乌东村的游客提供服务。

## 你的角色
- 文旅顾问：解答乌东村及苗族文化相关问题
- 行程规划师：根据游客需求生成可落地的游玩路线
- 购物向导：推荐平台内的银饰、蜡染、特产等商品
- 客服代表：解答订单、预订、支付等常见问题

## 核心原则
1. **只回答与乌东文旅相关的问题**，与文旅无关的话题礼貌拒绝
2. **推荐商品/民宿/餐饮时必须调用搜索工具**，禁止编造不存在的商品
3. **涉及价格、库存、房态等实时信息，必须调用工具获取最新数据**
4. **不确定的事情明确说不确定**，不要编造历史、典故或数据
5. **回答简洁实用**，行程规划用结构化格式，商品推荐给出明确理由

## 输出格式
- 普通回答：自然语言，适当分段
- 行程规划：按天组织，每天包含上午/下午/晚上，标注预估费用
- 商品推荐：列出商品名称、价格、推荐理由，附跳转链接
- 引用知识：末尾标注"——参考《文档名》"

## 安全边界
- 不展示用户的手机号、地址、完整身份证号等隐私信息
- 不处理退款、投诉、修改订单等需人工操作的请求，引导联系客服
- 输出内容遵守社区规范，不含敏感词
```

### 10.2 行程规划专用提示

当检测到用户有行程规划意图时，追加专项指令：

```
## 行程规划要求
- 充分考虑用户的人群特征（带老人/小孩/情侣/独行），节奏合理
- 每天安排不超过 3 个主要景点，留出休息和用餐时间
- 餐饮推荐结合当地特色（长桌宴、酸汤鱼、火塘腊味等）
- 住宿推荐符合预算和偏好（特色民宿/经济酒店/观景房）
- 总预算估算包含：交通+住宿+餐饮+门票+购物，分项列出
- 每个推荐项标注平台内链接，方便用户点击查看详情
- 最后给出 2-3 条实用贴士（穿衣、交通、最佳游览时间等）
```

---

## 11. 实施路线图

### Phase 0：准备（1~2 天）

- [ ] 安装 LangChain JS 依赖，配置 LLM API Key
- [ ] 搭建 m6-agent 模块骨架（controller/service/entity）
- [ ] 从前端迁移文化导览内容为 Markdown 知识文档
- [ ] 实现 RAG 基础链路（文档加载→切分→向量化→检索）

### Phase 1：问答 MVP（3~5 天）

- [ ] 实现最简对话接口（非流式，单轮问答）
- [ ] 接入 RAG 检索，回答文化/概况类问题
- [ ] 前端浮窗组件，支持基本对话
- [ ] 对话记录持久化（session + message 表）
- [ ] 敏感词过滤接入

**验收标准**：用户问"乌东有什么好玩的""银饰是怎么做的"，能基于知识库给出准确回答。

### Phase 2：Tool 接入（5~7 天）

- [ ] 实现商品搜索 Tool（对接 m1-goods）
- [ ] 实现民宿查询 Tool（对接 m3-lodging）
- [ ] 实现路线/景区 Tool（对接 m4-ticket）
- [ ] 实现餐饮查询 Tool（Mock 数据，后续接真实）
- [ ] Agent 编排：LLM 自动选择 Tool 调用
- [ ] 前端消息渲染支持商品卡片

**验收标准**：用户说"推荐 500 以内的银手镯"，Agent 能调用商品搜索 Tool，返回真实商品并给出推荐理由。

### Phase 3：行程规划（3~5 天）

- [ ] 行程规划专用提示词和输出格式
- [ ] 多 Tool 协同调用（同时查景点+民宿+餐饮）
- [ ] 前端行程时间线渲染组件
- [ ] 行程结果可保存/分享

**验收标准**：用户说"2 天 1 晚，带爸妈，预算 1500"，能生成包含每日安排、费用估算、推荐链接的完整行程。

### Phase 4：智能客服 + 优化（3~5 天）

- [ ] FAQ 知识库整理与导入
- [ ] 订单查询 Tool（需登录态）
- [ ] SSE 流式输出（替代非流式）
- [ ] 对话历史管理（截断、过期清理）
- [ ] Token 用量统计与成本监控
- [ ] 转人工客服引导

**验收标准**：常见客服问题自动解答率 ≥ 70%，无法解答的问题正确引导人工。

### 后续迭代（可选）

- [ ] 语音输入/输出（接入 ASR/TTS）
- [ ] 图片理解（用户上传景点照片，AI 识别并讲解）
- [ ] 个性化推荐（基于用户浏览/购买历史）
- [ ] 多语言支持（英文/日文，面向入境游客）
- [ ] Agent 自我评估与提示词优化闭环

---

## 12. 风险与注意事项

### 12.1 技术风险

| 风险 | 影响 | 应对 |
|---|---|---|
| LLM API 不稳定/限流 | 对话响应失败或超时 | 多模型 fallback（主模型失败自动切备选），前端重试机制 |
| Token 成本超预期 | 运营成本高 | 严格控制 Tool 返回数据量、对话历史轮数、设置单用户每日调用上限 |
| 幻觉编造商品 | 用户信任受损 | 所有推荐必须经 Tool 查询，System Prompt 强约束，输出后校验商品 ID 是否存在 |
| RAG 检索不准 | 回答质量差 | 优化切分策略、引入重排序（Reranker）、持续补充知识库 |

### 12.2 产品风险

| 风险 | 影响 | 应对 |
|---|---|---|
| 用户不知道有智能体 | 使用率低 | 首页引导气泡、新用户首次访问自动弹出推荐问题 |
| 回答不符合预期 | 用户失望 | 提供"赞/踩"反馈按钮，收集 bad case 持续优化 |
| 智能体与现有搜索/筛选功能重叠 | 定位模糊 | 明确分工：智能体做"探索式/模糊需求"，列表页做"精确筛选" |

### 12.3 合规风险

- **用户数据**：对话内容可能包含个人信息，需在隐私政策中说明数据用途
- **内容安全**：LLM 输出需经过敏感词过滤，避免违规内容
- **未成年人保护**：不针对未成年人做个性化推荐
- **生成内容标识**：按法规要求，AI 生成内容需有明确标识（可在对话面板标注"AI 生成内容仅供参考"）

---

## 13. 成本估算（参考）

以 DeepSeek-V3 为例（输入 ¥1/百万 Token，输出 ¥2/百万 Token）：

| 项目 | 单次对话估算 | 日均 100 次对话 | 月均 |
|---|---|---|---|
| 输入 Token（系统提示+历史+检索结果+Tool 返回） | ~3000 | 30 万 | 900 万 |
| 输出 Token（回答内容） | ~800 | 8 万 | 240 万 |
| 月费用 | - | - | **约 ¥13.8** |

即使日均 1000 次对话，月费用也仅约 ¥138，成本可控。

---

## 14. 总结

本方案的核心思路：

1. **轻量起步**：用 LangChain JS 集成进现有 MidwayJS 后端，不引入新技术栈
2. **只读接入**：Agent 作为现有业务模块的消费者，只调用查询接口，不做写入，零侵入
3. **RAG + Tool 双轮驱动**：文化知识用 RAG 检索，实时数据用 Tool 查询，兼顾知识深度和数据准确性
4. **分阶段交付**：从问答 MVP → Tool 推荐 → 行程规划 → 智能客服，每阶段都有可验收的独立价值
5. **成本可控**：严格控制 Token 消耗，月均费用极低

建议从 **Phase 0 + Phase 1** 开始，用 1 周时间跑通"文旅问答"最小闭环，验证技术可行性和用户接受度后再逐步扩展。
