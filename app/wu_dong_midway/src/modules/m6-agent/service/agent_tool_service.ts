/**
 * 【m6-agent 模块】Agent 工具集
 *
 * 把各模块已有的查询能力封装成 LLM 可调用的 function calling 工具：
 * 天气（WeatherService）+ 订单（order）+ 商品/特产（m1）+ 民宿（m3）+ 门票/路线（m4）。
 *
 * 约定：
 * - 只读：不提供下单/支付/取消等写操作，避免模型代替用户产生副作用；
 * - 跨模块只注入对方 Service，不直接访问别人的表；
 * - 工具统一返回中文纯文本，字段已裁剪成模型够用且好读的形态，不返回内部 id 与原始 JSON。
 */
import { Inject, Logger, Provide } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
import { ProductPageQueryDTO } from '../../m1-goods/dto/product.dto';
import { ProductService } from '../../m1-goods/service/product_service';
import { HomestayService } from '../../m3-lodging/service/homestay_service';
import { TicketService } from '../../m4-ticket/service/ticket_service';
import { OrderService } from '../../order/service/order_service';
import { WeatherService } from './weather_service';
import { WebSearchService } from './web_search_service';

/** 工具执行上下文：决定工具能看到哪些数据（订单只能看当前用户的） */
export interface ToolContext {
  /** 登录用户 id（BIGINT 以 string 传递），未登录为 null */
  userId: string | null;
  deviceId: string;
}

/** 订单状态、类型的中文文案，与前端展示口径一致 */
const ORDER_STATUS_TEXT: Record<string, string> = {
  UNPAID: '待支付',
  PAID: '已支付',
  CONFIRMED: '已确认',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  REFUNDED: '已退款',
};

const ORDER_TYPE_TEXT: Record<string, string> = {
  GOODS: '服饰',
  SPECIALTY: '特产',
  MEAL: '餐饮',
  LODGING: '住宿',
  TICKET: '门票',
  ROUTE: '路线',
};

/** 单个工具最多返回给模型的条数，防止把上下文撑爆 */
const MAX_ITEMS = 8;

function money(value: number | null | undefined): string {
  return value === null || value === undefined ? '未标价' : `¥${Number(value).toFixed(2)}`;
}

function dateTime(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 富文本简介转成一行纯文本，避免把 HTML 塞给模型 */
function plainText(text: string | null | undefined, max = 60): string {
  if (!text) return '';
  const clean = String(text)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

const NOT_LOGGED_IN = '用户当前未登录，查不到订单数据。请先提示用户登录，登录后再帮他查。';

/** 暴露给 LLM 的工具定义（OpenAI function calling 格式） */
export const AGENT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_wudong_weather',
      description:
        '查询乌东村（贵州省雷山县丹江镇）的当前天气和未来几天预报。当用户问到天气、气温、下雨、穿衣、出行天气等问题时调用。',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'integer',
            description: '需要预报的天数，1-7，默认 3。只问当前天气或今天天气时传 1。',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description:
        '联网搜索乌东（贵州雷山县）周边的时效性信息。只在这些情况用：节庆活动的时间安排、交通班次与路况、临时通知或封路、近期新开/暂停营业的店、近期游客的口碑反馈，以及知识库里没有而用户又确实需要的本地新消息。不要用它查常识、文化介绍、天气、商品、民宿、门票、路线和订单——这些有专门的工具或知识库。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              '搜索关键词，要具体，带上地名和时间，例如"乌东村 苗年节 2026 时间"、"雷山县 丹江镇 班车 时刻表"。',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_my_orders',
      description:
        '查询当前登录用户自己的订单列表。用户问"我的订单"、"我买的特产到哪了"、"有没有待付款的"时调用。只能查当前用户的订单，无法查询他人订单。',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['ALL', 'GOODS', 'SPECIALTY', 'MEAL', 'LODGING', 'TICKET', 'ROUTE'],
            description: '按订单类型筛选，不筛就传 ALL。',
          },
          status: {
            type: 'string',
            enum: [
              'ALL',
              'UNPAID',
              'PAID',
              'CONFIRMED',
              'IN_PROGRESS',
              'COMPLETED',
              'CANCELLED',
              'REFUNDED',
            ],
            description: '按订单状态筛选，不筛就传 ALL。',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_order_detail',
      description:
        '按订单号查询某一笔订单的详情（含商品明细与支付记录）。用户提供了订单号，或问"这笔订单怎么样了"时调用。',
      parameters: {
        type: 'object',
        properties: {
          order_no: {
            type: 'string',
            description: '订单号。必须是用户提供的订单号，不要自己编造。',
          },
        },
        required: ['order_no'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_products',
      description:
        '查询乌东可买的服饰与特产（银饰、蜡染、茶叶、天麻等）。用户问"有什么特产"、"哪里能买"、"多少钱"、"推荐伴手礼"时调用。',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '商品名关键词，如"银饰"、"茶叶"；不限定就不传。' },
          module: {
            type: 'string',
            enum: ['ALL', 'GOODS', 'SPECIALTY'],
            description: 'GOODS 服饰类，SPECIALTY 特产类，ALL 或不传表示都查。',
          },
          max_price: { type: 'number', description: '价格上限（元），用户有预算要求时传入。' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_homestays',
      description:
        '查询乌东的民宿列表（名称、评分、地址、特色标签、简介）。用户问"住哪儿"、"有没有民宿"、"住宿推荐"时调用。',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '民宿名关键词，不限定就不传。' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_tickets',
      description:
        '查询乌东各景区的门票（名称、价格、余票、说明）。用户问"门票多少钱"、"景区要门票吗"时调用。',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '门票或景区名关键词，不限定就不传。' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_routes',
      description:
        '查询乌东的游玩路线/行程产品（标题、天数、价格、主题、出发地）。用户问"有什么路线"、"玩几天怎么安排"、"跟团"时调用。',
      parameters: {
        type: 'object',
        properties: {
          theme: { type: 'string', description: '路线主题，如"民俗"、"徒步"；不限定就不传。' },
        },
        required: [],
      },
    },
  },
];

@Provide()
export class AgentToolService {
  @Inject()
  weatherService: WeatherService;

  @Inject()
  webSearchService: WebSearchService;

  @Inject()
  orderService: OrderService;

  @Inject()
  productService: ProductService;

  @Inject()
  homestayService: HomestayService;

  @Inject()
  ticketService: TicketService;

  @Logger()
  logger: ILogger;

  /** 工具定义，供 AgentService 绑定到模型 */
  readonly definitions = AGENT_TOOLS;

  /**
   * 执行工具，返回给模型的纯文本。
   * 工具内部异常统一转成可读提示交回模型，不中断整轮对话。
   */
  async run(name: string, args: Record<string, any> = {}, ctx: ToolContext): Promise<string> {
    try {
      switch (name) {
        case 'get_wudong_weather':
          return await this.getWeather(args);
        case 'web_search':
          return await this.webSearch(args);
        case 'list_my_orders':
          return await this.listMyOrders(args, ctx);
        case 'get_order_detail':
          return await this.getOrderDetail(args, ctx);
        case 'search_products':
          return await this.searchProducts(args);
        case 'list_homestays':
          return await this.listHomestays(args);
        case 'search_tickets':
          return await this.searchTickets(args);
        case 'search_routes':
          return await this.searchRoutes(args);
        default:
          return `未知工具：${name}`;
      }
    } catch (err: any) {
      this.logger.error('[m6-agent] tool %s failed: %s', name, err?.message || err);
      return `工具调用失败：${err?.message || err}`;
    }
  }

  private async getWeather(args: Record<string, any>): Promise<string> {
    const days = Number(args.days) || 3;
    return this.weatherService.getWudongWeather(days);
  }

  /** 联网搜索（仅限乌东时效性信息，具体口径见工具描述） */
  private async webSearch(args: Record<string, any>): Promise<string> {
    return this.webSearchService.search(String(args.query ?? ''));
  }

  /** 我的订单列表 */
  private async listMyOrders(args: Record<string, any>, ctx: ToolContext): Promise<string> {
    if (!ctx.userId) return NOT_LOGGED_IN;

    const type = this.pick(args.type);
    const status = this.pick(args.status);
    const orders = await this.orderService.list(ctx.userId, {
      type: type === 'ALL' ? undefined : type,
      status: status === 'ALL' ? undefined : status,
    });

    const filterText = [
      type && type !== 'ALL' ? `类型 ${ORDER_TYPE_TEXT[type] || type}` : '全部类型',
      status && status !== 'ALL' ? `状态 ${ORDER_STATUS_TEXT[status] || status}` : '全部状态',
    ].join('｜');

    if (!orders.length) {
      return `该用户没有符合条件的订单（筛选：${filterText}）。`;
    }

    const lines = orders.slice(0, MAX_ITEMS).map((order: any, index: number) => {
      const items = (order.items ?? []) as any[];
      const content = items.length
        ? items
            .map((it) => `${it.title}${it.skuName ? `（${it.skuName}）` : ''}×${it.qty}`)
            .join('、')
        : order.title;
      return (
        `${index + 1}. 单号 ${order.orderNo}｜${ORDER_TYPE_TEXT[order.type] || order.type}｜` +
        `${money(order.amount)}｜${ORDER_STATUS_TEXT[order.status] || order.status}｜下单 ${dateTime(order.createdAt)}\n` +
        `   内容：${content}`
      );
    });

    const tail =
      orders.length > MAX_ITEMS ? `\n（共 ${orders.length} 笔，只列出最近的 ${MAX_ITEMS} 笔）` : '';
    return `共 ${orders.length} 笔订单（筛选：${filterText}）：\n${lines.join('\n')}${tail}`;
  }

  /** 订单详情（含明细与支付记录） */
  private async getOrderDetail(args: Record<string, any>, ctx: ToolContext): Promise<string> {
    if (!ctx.userId) return NOT_LOGGED_IN;

    const orderNo = String(args.order_no ?? '').trim();
    if (!orderNo) return '缺少订单号，需要用户先提供订单号才能查详情。';

    const order: any = await this.orderService.detail(orderNo, ctx.userId);
    if (!order) {
      return `没有找到单号 ${orderNo} 的订单。可能是单号有误，或这笔订单不属于当前用户。`;
    }

    const lines = [
      `订单号：${order.orderNo}`,
      `类型：${ORDER_TYPE_TEXT[order.type] || order.type}｜状态：${ORDER_STATUS_TEXT[order.status] || order.status}`,
      `标题：${order.title}`,
      `金额：${money(order.amount)}（${order.qty} 件）`,
      order.shopName ? `店铺：${order.shopName}` : '',
      `下单时间：${dateTime(order.createdAt)}${order.paidAt ? `｜支付时间：${dateTime(order.paidAt)}` : ''}`,
    ].filter(Boolean);

    const items = (order.items ?? []) as any[];
    if (items.length) {
      lines.push('明细：');
      for (const it of items) {
        lines.push(
          `- ${it.title}${it.skuName ? `（${it.skuName}）` : ''} × ${it.qty}，${money(it.amount)}`
        );
      }
    }

    const payments = (order.payments ?? []) as any[];
    if (payments.length) {
      lines.push('支付记录：');
      for (const p of payments) {
        lines.push(
          `- ${p.payNo}｜${money(p.amount)}｜${p.status}｜${p.provider}｜支付时间 ${dateTime(p.paidAt)}`
        );
      }
    } else {
      lines.push('支付记录：暂无（该订单还没有支付记录）');
    }

    if (order.status === 'UNPAID' && order.expireAt) {
      lines.push(`未支付订单将于 ${dateTime(order.expireAt)} 自动取消。`);
    }
    if (order.cancelReason) lines.push(`取消原因：${order.cancelReason}`);

    return lines.join('\n');
  }

  /** 商品 / 特产查询 */
  private async searchProducts(args: Record<string, any>): Promise<string> {
    const keyword = String(args.keyword ?? '').trim();
    const module = this.pick(args.module);
    const maxPrice = Number(args.max_price);

    const query: ProductPageQueryDTO = {
      page: 1,
      page_size: MAX_ITEMS,
      status: 'ON_SHELF',
      sort: 'sales',
      ...(keyword ? { keyword } : {}),
      ...(module && module !== 'ALL' ? { module: module as any } : {}),
      ...(Number.isFinite(maxPrice) && maxPrice > 0 ? { max_price: maxPrice } : {}),
    };

    const result = await this.productService.page(query);
    const desc = [keyword ? `关键词"${keyword}"` : '', module && module !== 'ALL' ? ORDER_TYPE_TEXT[module] || module : '']
      .filter(Boolean)
      .join('｜');

    if (!result.items.length) {
      return `${desc ? `${desc}，` : ''}没有查到在售的商品或特产。`;
    }

    const lines = result.items.map(
      (p) =>
        `- ${p.title}｜${money(p.price)}${p.marketPrice ? `（原价 ${money(p.marketPrice)}）` : ''}｜` +
        `${p.category || '未分类'}｜销量 ${p.sales}｜评分 ${p.rating}｜${p.stock > 0 ? `库存 ${p.stock}` : '暂时缺货'}`
    );
    return `在售商品共 ${result.total} 件（按销量排序取前 ${result.items.length} 件）${desc ? `（${desc}）` : ''}：\n${lines.join('\n')}`;
  }

  /** 民宿查询 */
  private async listHomestays(args: Record<string, any>): Promise<string> {
    const keyword = String(args.keyword ?? '').trim();
    const result: any = await this.homestayService.page({
      page: 1,
      size: MAX_ITEMS,
      status: 'ENABLED',
      ...(keyword ? { keyword } : {}),
    });

    const list = (result?.list ?? []) as any[];
    if (!list.length) {
      return `${keyword ? `关键词"${keyword}"，` : ''}没有查到可预订的民宿。`;
    }

    const lines = list.map((h) => {
      const tags = Array.isArray(h.tags) && h.tags.length ? `｜标签 ${h.tags.join('/')}` : '';
      const intro = plainText(h.intro, 50);
      return (
        `- ${h.name}｜评分 ${h.rating}｜${h.address || '地址未标注'}${tags}` +
        (intro ? `\n  简介：${intro}` : '')
      );
    });
    return `共 ${result?.total ?? list.length} 家民宿：\n${lines.join('\n')}\n（具体房型与价格需要用户在住宿页选择日期查看）`;
  }

  /** 门票查询 */
  private async searchTickets(args: Record<string, any>): Promise<string> {
    const keyword = String(args.keyword ?? '').trim();
    const result: any = await this.ticketService.page({
      page: 1,
      size: MAX_ITEMS,
      ...(keyword ? { keyword } : {}),
    });

    const list = (result?.list ?? []) as any[];
    if (!list.length) {
      return `${keyword ? `关键词"${keyword}"，` : ''}没有查到门票信息。`;
    }

    const lines = list.map(
      (t) =>
        `- ${t.name}｜${money(t.price)}｜${t.stock > 0 ? `余票 ${t.stock}` : '已售完'}` +
        (t.note ? `｜${plainText(t.note, 40)}` : '')
    );
    return `共 ${result?.total ?? list.length} 种门票：\n${lines.join('\n')}`;
  }

  /** 路线查询 */
  private async searchRoutes(args: Record<string, any>): Promise<string> {
    const theme = String(args.theme ?? '').trim();
    const result: any = await this.ticketService.routePage({
      page: 1,
      size: MAX_ITEMS,
      status: 'ON_SHELF',
      ...(theme ? { theme } : {}),
    });

    const list = (result?.list ?? []) as any[];
    if (!list.length) {
      return `${theme ? `主题"${theme}"，` : ''}没有查到在售的路线。`;
    }

    const lines = list.map(
      (r) =>
        `- ${r.title}｜${r.days} 天｜${money(r.price)}/人｜主题 ${r.theme || '未标注'}｜` +
        `出发地 ${r.departure || '未标注'}｜销量 ${r.sales}｜评分 ${r.rating}`
    );
    return `共 ${result?.total ?? list.length} 条路线（按最新排序取前 ${list.length} 条）：\n${lines.join('\n')}`;
  }

  /** 取请求参数里的枚举值并转成大写，缺省返回空串 */
  private pick(value: unknown): string {
    return typeof value === 'string' ? value.trim().toUpperCase() : '';
  }
}
