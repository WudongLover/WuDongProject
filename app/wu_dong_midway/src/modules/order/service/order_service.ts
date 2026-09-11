/**
<<<<<<< HEAD
 * 【order 模块】订单公共链路业务逻辑
 *
 * 职责：create（下单）/ list（列表）/ pay / cancel / refund 五个用例，与订单状态机。
 * 边界：
 * - 数据访问一律经 OrderMapper，本文件不出现 Repository / SQL
 * - 六类订单的预订参数按 type 分发写入 wudong_m1~m4_order_ext（规范 8.3 授权的同事务写入）
 * - 只有购物车清空是跨模块动作，经 m1 的 CartService 调用，不直连其表
 */
import { Inject, Provide } from '@midwayjs/core';
import { CartService } from '../../m1-goods/service/cart_service';
import { ApiError } from '../../m5-community/error/api_error';
import type { OrderEntity } from '../entity/order_entity';
import { CreateBundleInput, OrderExtInput, OrderMapper } from '../mapper/order_mapper';

/** 与 scripts/sql/wudong_schema.sql 的 type 列取值一致 */
const VALID_TYPES = new Set(['GOODS', 'SPECIALTY', 'MEAL', 'LODGING', 'TICKET', 'ROUTE']);

/** 与 order.status 列取值一致（前端 types.ts OrderStatus） */
const VALID_STATUSES = new Set([
  'UNPAID',
  'PAID',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
]);

/** 实物类订单：明细写 wudong_common_order_item */
const GOODS_TYPES = new Set(['GOODS', 'SPECIALTY']);

/** type → 订单事件消费方模块 */
const MODULE_BY_TYPE: Record<string, string> = {
  GOODS: 'm1',
  SPECIALTY: 'm1',
  MEAL: 'm2',
  LODGING: 'm3',
  TICKET: 'm4',
  ROUTE: 'm4',
};

/** 未支付订单的存活时长，超时由后续任务释放（本模块只负责写 expire_at） */
const PAY_EXPIRE_MS = 30 * 60 * 1000;

/**
 * 展示时区偏移，与 config.default.ts 中 typeorm 的 timezone: '+08:00' 保持一致。
 * 订单时间列按该时区解析，展示日期也必须按同一时区格式化——
 * 否则东八区 00:00~08:00 的订单会被 UTC 切片成前一天。
 */
const TZ_OFFSET_MS = 8 * 60 * 60 * 1000;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 列宽守卫，取 wudong_common_order 与各 mX_order_ext 的实际上限。
 * 不守卫时超长值由 MySQL 抛 1406，前端只能看到「系统繁忙」。
 * contact_phone 按各 ext 表最窄的 11 位取（m2 线上是 20，但 m3/m4 是 11）。
 */
const MAX_LEN = {
  title: 255,
  cover: 500,
  summary: 500,
  shopName: 128,
  contactName: 64,
  contactPhone: 11,
  diningTime: 64,
} as const;

/** DECIMAL(10,2) 上限，超出会被 MySQL 抛 1264 */
const MAX_AMOUNT = 99999999.99;

/** INT UNSIGNED 上限，超出会被 MySQL 抛 1264 */
const MAX_UINT32 = 4294967295;

/** 取消 / 退款原因目前由用户操作直接触发，尚无填写入口 */
const CANCEL_REASON = '用户取消';
const REFUND_REASON = '用户申请退款';

/** 单号撞唯一键时的重试次数 */
const ORDER_NO_MAX_ATTEMPTS = 3;

/** MySQL 唯一键冲突（TypeORM QueryFailedError 会把 driverError 的属性摊到自身上） */
function isDuplicateKey(err: unknown): boolean {
  const e = err as { code?: string; errno?: number; driverError?: { code?: string; errno?: number } };
  return (
    e?.code === 'ER_DUP_ENTRY' ||
    e?.errno === 1062 ||
    e?.driverError?.code === 'ER_DUP_ENTRY' ||
    e?.driverError?.errno === 1062
  );
}

/** 前端 m4-order.ts 的 CreateOrderPayload */
export interface CreateOrderPayload {
  type: string;
=======
 * 【order 模块】订单主表业务逻辑（公共订单链路）
 *
 * 通用能力，不识别具体业务类型（GOODS/MEAL/LODGING...）：
 * - createOrder：建主表 + 生成单号（供各业务模块在自己的事务内调用，传入 manager 保证原子性）
 * - pay：mock 支付（不接真实支付 API，只落一条 SUCCESS 支付记录并置 PAID，幂等）
 * - cancelOrder：状态置 CANCELLED（库存回补由业务模块方负责，见 m3 booking_service）
 * - list / detail：订单查询
 */
import { Inject, Provide } from '@midwayjs/core';
import { InjectDataSource, InjectEntityModel } from '@midwayjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ApiError } from '../../m5-community/error/api_error';
import { OrderEntity, OrderStatus, OrderType } from '../entity/order_entity';
import { PaymentEntity } from '../entity/payment_entity';

/** 建单入参：字段与 wudong_common_order 列对齐，业务模块负责组装展示快照 */
export interface CreateOrderInput {
  userId: string;
  type: OrderType;
>>>>>>> origin/lanub/v0911
  title: string;
  cover?: string;
  summary?: string;
  amount: number;
<<<<<<< HEAD
  qty: number;
  shop?: string;
  /** 购物车结算：待并入本单的购物车项 */
  cartItemIds?: string[];
  /** TICKET */
  scenicId?: string;
  ticketId?: string;
  /** ROUTE */
  routeId?: string;
  /** TICKET / ROUTE */
  travelDate?: string;
  /** LODGING */
  homestayId?: string;
  roomTypeId?: string;
  checkIn?: string;
  checkOut?: string;
  /** MEAL */
  restaurantId?: string;
  slotId?: string;
  diningDate?: string;
  diningTime?: string;
  /** MEAL / LODGING，缺省 1 */
  guests?: number;
  contactName?: string;
  contactPhone?: string;
}

export interface OrderListQuery {
  type?: string;
  status?: string;
}

/** 前端 types.ts 的 Order */
export interface OrderVo {
  orderNo: string;
  type: string;
  status: string;
  title: string;
  cover: string;
  summary: string;
  amount: number;
  qty: number;
  date: string;
  shop: string;
=======
  qty?: number;
  shopName?: string;
  merchantId?: string;
  /** 初始状态：住宿 UNPAID（默认），餐饮 CONFIRMED */
  status?: OrderStatus;
  /** 支付截止时间：住宿下单时写入 now+30min */
  expireAt?: Date;
>>>>>>> origin/lanub/v0911
}

@Provide()
export class OrderService {
<<<<<<< HEAD
  @Inject()
  mapper: OrderMapper;

  /** 跨模块调用：清空已结算的购物车项 */
  @Inject()
  cartService: CartService;

  /* ------------------------------ 用例 ------------------------------ */

  /** 下单：写订单主表 + 明细 + 模块扩展 + ORDER_CREATED 事件，随后清空已结算购物车 */
  async create(userId: string, payload: CreateOrderPayload): Promise<OrderVo> {
    const type = String(payload?.type || '');
    if (!VALID_TYPES.has(type)) {
      throw new ApiError(1004, '订单类型不合法');
    }
    const title = this.clip(payload?.title, '订单标题', MAX_LEN.title, true);
    const cover = this.clip(payload?.cover, '封面图地址', MAX_LEN.cover);
    const summary = this.clip(payload?.summary, '订单摘要', MAX_LEN.summary);
    const shopName = this.clip(payload?.shop, '店铺名', MAX_LEN.shopName);

    const amount = Number(payload?.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) {
      throw new ApiError(1004, '订单金额不合法');
    }
    const qty = Number(payload?.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_UINT32) {
      throw new ApiError(1004, '订单数量不合法');
    }

    const cartItemIds = this.toStringArray(payload?.cartItemIds);
    const items = await this.buildItems(userId, type, cartItemIds);
    const priced = this.reconcileGoods(type, items, amount, qty);
    const ext = this.buildExt(type, payload, items, priced.qty);
    const orderNo = this.createNo('WD');

    const bundle: CreateBundleInput = {
      order: {
        orderNo,
        userId,
        type,
        status: 'UNPAID',
        title,
        cover,
        summary,
        amount: priced.amount,
        qty: priced.qty,
        shopName,
        expireAt: new Date(Date.now() + PAY_EXPIRE_MS),
      },
      items,
      ext,
      event: {
        orderNo,
        eventType: 'ORDER_CREATED',
        targetModule: MODULE_BY_TYPE[type],
        status: 'PENDING',
        payload: { type, amount: priced.amount },
      },
    };

    const order = await this.persistOrder(bundle);

    // 订单已落库后再清购物车。跨模块走 CartService；此处失败不回滚订单，
    // 否则用户会看到「下单失败」但订单其实已存在。
    await this.clearCart(userId, cartItemIds);

    return this.toOrder(order);
  }

  /** 订单列表：type / status 双过滤，取值 'ALL' 或缺省表示不过滤 */
  async list(userId: string, query: OrderListQuery = {}): Promise<OrderVo[]> {
    const type = this.normalizeFilter(query?.type, VALID_TYPES, '订单类型');
    const status = this.normalizeFilter(query?.status, VALID_STATUSES, '订单状态');
    const orders = await this.mapper.list(userId, type, status);
    return orders.map((order) => this.toOrder(order));
  }

  /** 支付：UNPAID → PAID，写 mock 支付单并投递 ORDER_PAID */
  async pay(userId: string, orderNo: string): Promise<OrderVo> {
    const order = await this.requireOwned(userId, orderNo);
    if (order.status !== 'UNPAID') {
      throw new ApiError(3001, '订单状态不允许该操作');
    }
    const paidAt = new Date();
    order.status = 'PAID';
    order.paidAt = paidAt;

    await this.mapper.applyTransition({
      orderId: order.id,
      // 条件更新：并发下只有第一个请求能从 UNPAID 翻到 PAID，
      // 其余 affected=0 → 3001 并回滚，不会重复插支付单
      fromStatuses: ['UNPAID'],
      patch: { status: 'PAID', paidAt },
      payment: {
        payNo: this.createNo('PAY'),
=======
  @InjectDataSource('default')
  dataSource: DataSource;

  @InjectEntityModel(OrderEntity)
  orderRepo: Repository<OrderEntity>;

  @InjectEntityModel(PaymentEntity)
  paymentRepo: Repository<PaymentEntity>;

  /** 单号：WD + yymmdd + 6 位随机 */
  private genNo(prefix: string) {
    const d = new Date();
    const ymd =
      String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    return prefix + ymd + rand;
  }

  private orderRepoOf(em?: EntityManager): Repository<OrderEntity> {
    return em ? em.getRepository(OrderEntity) : this.orderRepo;
  }

  /**
   * 建单：返回落库后的订单实体。
   * 传入 em 时在调用方事务内执行（供 m2/m3 booking service 做「建单 + 写 ext + 扣库存」原子化）。
   */
  async createOrder(
    input: CreateOrderInput,
    em?: EntityManager,
  ): Promise<OrderEntity> {
    const repo = this.orderRepoOf(em);
    const order = repo.create({
      orderNo: this.genNo('WD'),
      userId: input.userId,
      merchantId: input.merchantId ?? '0',
      type: input.type,
      status: input.status ?? 'UNPAID',
      title: input.title,
      cover: input.cover ?? '',
      summary: input.summary ?? '',
      amount: input.amount,
      qty: input.qty ?? 1,
      shopName: input.shopName ?? '',
      expireAt: input.expireAt ?? null,
    });
    return repo.save(order);
  }

  /** 订单列表（当前用户，可选 type/status 过滤） */
  async list(
    userId: string,
    filter?: { type?: string; status?: string },
  ): Promise<OrderEntity[]> {
    const where: any = { userId };
    if (filter?.type && filter.type !== 'ALL') where.type = filter.type;
    if (filter?.status && filter.status !== 'ALL') where.status = filter.status;
    return this.orderRepo.find({ where, order: { createdAt: 'DESC', id: 'DESC' } });
  }

  /** 订单详情：主表 + 支付记录 */
  async detail(orderNo: string, userId?: string) {
    const where: any = { orderNo };
    if (userId) where.userId = userId;
    const order = await this.orderRepo.findOne({ where });
    if (!order) return null;
    const payments = await this.paymentRepo.find({
      where: { orderNo },
      order: { id: 'ASC' },
    });
    return { ...order, payments };
  }

  /**
   * mock 支付：不接真实支付 API，直接落一条 SUCCESS 支付记录并置 PAID。
   * 幂等：订单已是 PAID 直接返回，不重复写支付记录。
   */
  async pay(orderNo: string, userId: string): Promise<OrderEntity> {
    return this.dataSource.transaction(async (em) => {
      const orderRepo = em.getRepository(OrderEntity);
      const order = await orderRepo.findOne({ where: { orderNo, userId } });
      if (!order) throw new ApiError(1003, '订单不存在', 404);
      if (order.status === 'PAID') return order;
      if (order.status !== 'UNPAID') {
        throw new ApiError(1004, `订单状态 ${order.status} 不可支付`);
      }

      const paymentRepo = em.getRepository(PaymentEntity);
      const payment = paymentRepo.create({
        payNo: this.genNo('PAY'),
>>>>>>> origin/lanub/v0911
        orderNo: order.orderNo,
        userId,
        amount: order.amount,
        status: 'SUCCESS',
        provider: 'mock',
<<<<<<< HEAD
        credential: `mock-${Date.now()}`,
        paidAt,
      },
      event: {
        orderNo: order.orderNo,
        eventType: 'ORDER_PAID',
        targetModule: MODULE_BY_TYPE[order.type],
        status: 'PENDING',
        payload: { amount: order.amount },
      },
    });
    return this.toOrder(await this.reload(userId, order.orderNo, order));
  }

  /** 取消：UNPAID / PAID → CANCELLED；已支付的同步把支付单置为已退款 */
  async cancel(userId: string, orderNo: string): Promise<OrderVo> {
    const order = await this.requireOwned(userId, orderNo);
    if (!['UNPAID', 'PAID'].includes(order.status)) {
      throw new ApiError(3001, '订单状态不允许该操作');
    }
    // 必须在改写 status 之前判断
    const wasPaid = order.status === 'PAID';
    const cancelledAt = new Date();
    order.status = 'CANCELLED';
    order.cancelledAt = cancelledAt;
    order.cancelReason = CANCEL_REASON;

    // 已支付订单被取消等价于退钱，支付单要同步置为 REFUNDED，
    // 否则订单已取消而支付单仍是 SUCCESS，台账对不上。
    // payment.status 的取值集合（PENDING/SUCCESS/FAILED/REFUNDED）里没有 CANCELLED。
    const payment = wasPaid ? await this.mapper.findPayment(order.orderNo, userId) : null;

    await this.mapper.applyTransition({
      orderId: order.id,
      fromStatuses: ['UNPAID', 'PAID'],
      patch: { status: 'CANCELLED', cancelledAt, cancelReason: CANCEL_REASON },
      payment: payment ? { ...payment, status: 'REFUNDED' } : null,
      event: {
        orderNo: order.orderNo,
        eventType: 'ORDER_CANCELLED',
        targetModule: MODULE_BY_TYPE[order.type],
        status: 'PENDING',
        payload: null,
      },
    });
    return this.toOrder(await this.reload(userId, order.orderNo, order));
  }

  /** 退款：PAID / CONFIRMED → REFUNDED，同步把支付单置为已退款 */
  async refund(userId: string, orderNo: string): Promise<OrderVo> {
    const order = await this.requireOwned(userId, orderNo);
    if (!['PAID', 'CONFIRMED'].includes(order.status)) {
      throw new ApiError(3001, '订单状态不允许该操作');
    }
    order.status = 'REFUNDED';
    order.refundAmount = order.amount;
    order.refundReason = REFUND_REASON;

    const payment = await this.mapper.findPayment(order.orderNo, userId);

    await this.mapper.applyTransition({
      orderId: order.id,
      fromStatuses: ['PAID', 'CONFIRMED'],
      patch: {
        status: 'REFUNDED',
        refundAmount: order.amount,
        refundReason: REFUND_REASON,
      },
      payment: payment ? { ...payment, status: 'REFUNDED' } : null,
      event: {
        orderNo: order.orderNo,
        eventType: 'REFUND_APPROVED',
        targetModule: MODULE_BY_TYPE[order.type],
        status: 'PENDING',
        payload: { amount: order.amount },
      },
    });
    return this.toOrder(await this.reload(userId, order.orderNo, order));
  }

  /* ---------------------------- 内部实现 ---------------------------- */

  /** 取订单并校验归属；不存在与不属于当前用户同样报 1003，避免探测他人单号 */
  private async requireOwned(userId: string, orderNo: string): Promise<OrderEntity> {
    const no = String(orderNo || '').trim();
    if (!no) {
      throw new ApiError(1004, '缺少订单号');
    }
    const order = await this.mapper.findOwned(userId, no);
    if (!order) {
      throw new ApiError(1003, '订单不存在', 404);
    }
    return order;
  }

  /**
   * 实物类订单的明细行，来自购物车快照。
   * 非实物类订单的预订参数在扩展表里，没有明细行。
   */
  private async buildItems(
    userId: string,
    type: string,
    cartItemIds: string[],
  ): Promise<CreateBundleInput['items']> {
    if (!GOODS_TYPES.has(type)) {
      return [];
    }
    const wanted = new Set(cartItemIds);
    if (!wanted.size) {
      throw new ApiError(1004, '请先选择要结算的商品');
    }
    const cartItems = (await this.cartService.list(userId)).filter((item) =>
      wanted.has(item.id),
    );
    if (!cartItems.length) {
      throw new ApiError(1003, '购物车商品不存在', 404);
    }
    return cartItems.map((item) => ({
      targetType: type,
      targetId: item.productId,
      skuId: item.skuId,
      title: item.title,
      cover: item.cover,
      // CartItemVo.sku 是 SKU 名快照，对应 order_item.sku_name
      skuName: item.sku,
      price: item.price,
      qty: item.qty,
      amount: this.round(item.price * item.qty),
    }));
  }

  /** 按 type 组装对应的 wudong_mX_order_ext 行，顺带完成该类型的必填校验 */
  private buildExt(
    type: string,
    payload: CreateOrderPayload,
    items: CreateBundleInput['items'],
    qty: number,
  ): OrderExtInput {
    const contactName = this.clip(payload?.contactName, '联系人', MAX_LEN.contactName);
    const contactPhone = this.clip(payload?.contactPhone, '联系电话', MAX_LEN.contactPhone);

    if (GOODS_TYPES.has(type)) {
      // m1_order_ext 与订单一对一，购物车合并下单时只能承载首件商品；
      // 多商品明细已在 wudong_common_order_item 中逐行记录。
      const first = items[0];
      return {
        kind: 'm1',
        row: {
          productId: String(first.targetId),
          skuId: String(first.skuId ?? 0),
          receiverName: '',
          receiverPhone: '',
          receiverAddr: '',
          logisticsNo: '',
        },
      };
    }

    if (type === 'MEAL') {
      return {
        kind: 'm2',
        row: {
          restaurantId: this.requireId(payload?.restaurantId, '餐厅'),
          // 餐位预订目前是展示页（docx/TODO.md），前端 api/food.ts 的 slots 恒为空数组，
          // 拿不到 slotId；而 m2_order_ext.slot_id 是 NOT NULL 无默认值，
          // 故缺省写 0 表示「未指定时段」，让订单流程不至于 500。
          // 待 m2 开放时段接口后，这里应恢复为必填。
          slotId: payload?.slotId ? this.requireId(payload.slotId, '预订时段') : '0',
          diningDate: this.requireDate(payload?.diningDate, '用餐日期'),
          diningTime: this.clip(payload?.diningTime, '用餐时段', MAX_LEN.diningTime),
          guests: this.positiveInt(payload?.guests, qty),
          contactName,
          contactPhone,
        },
      };
    }

    if (type === 'LODGING') {
      const checkIn = this.requireDate(payload?.checkIn, '入住日期');
      const checkOut = this.requireDate(payload?.checkOut, '离店日期');
      const nights = this.diffDays(checkIn, checkOut);
      if (nights < 1) {
        throw new ApiError(1004, '离店日期必须晚于入住日期');
      }
      return {
        kind: 'm3',
        row: {
          homestayId: this.requireId(payload?.homestayId, '民宿'),
          roomTypeId: this.requireId(payload?.roomTypeId, '房型'),
          checkInDate: checkIn,
          checkOutDate: checkOut,
          nights,
          guests: this.positiveInt(payload?.guests, 1),
          contactName,
          contactPhone,
        },
      };
    }

    // TICKET / ROUTE
    const travelDate = this.requireDate(payload?.travelDate, '出游日期');
    const scenicId = payload?.scenicId ? this.requireId(payload.scenicId, '景区') : null;
    const ticketId = payload?.ticketId ? this.requireId(payload.ticketId, '门票') : null;
    const routeId = payload?.routeId ? this.requireId(payload.routeId, '路线') : null;
    if (type === 'TICKET' && !(scenicId && ticketId)) {
      throw new ApiError(1004, '门票订单缺少景区或票档');
    }
    if (type === 'ROUTE' && !routeId) {
      throw new ApiError(1004, '路线订单缺少路线信息');
    }
    return {
      kind: 'm4',
      row: {
        scenicId,
        ticketId,
        routeId,
        travelDate,
        guests: this.positiveInt(payload?.guests, qty),
        contactName,
        contactPhone,
      },
    };
  }

  /** 清空已结算购物车项；单条失败不影响其他，也不影响已创建的订单 */
  private async clearCart(userId: string, cartItemIds: string[]): Promise<void> {
    for (const id of cartItemIds) {
      await this.cartService.remove(userId, id);
    }
  }

  /**
   * 实物类订单的金额与数量以购物车明细为准，不接受客户端报价。
   * 否则 `amount: 0.01` 就能生成一笔金额只有 1 分钱的合法订单，
   * 支付单与退款额随之失真。
   */
  private reconcileGoods(
    type: string,
    items: CreateBundleInput['items'],
    amount: number,
    qty: number,
  ): { amount: number; qty: number } {
    if (!GOODS_TYPES.has(type)) {
      return { amount: this.round(amount), qty };
    }
    const computedAmount = this.round(
      items.reduce((sum, item) => sum + Number(item.price ?? 0) * Number(item.qty ?? 0), 0),
    );
    const computedQty = items.reduce((sum, item) => sum + Number(item.qty ?? 0), 0);
    // 允许 1 分钱浮点误差，其余一律视为客户端算错或篡改
    if (Math.abs(this.round(amount) - computedAmount) > 0.01) {
      throw new ApiError(1004, '订单金额与商品明细不一致');
    }
    if (qty !== computedQty) {
      throw new ApiError(1004, '订单数量与商品明细不一致');
    }
    return { amount: computedAmount, qty: computedQty };
  }

  /**
   * 落库下单，单号撞唯一键时换号重试。
   * 单号含 8 位时间戳 + 3 位随机，撞键概率极低；但真撞上时若不重试，
   * 用户只会看到「系统繁忙」，再点一次就变成第二笔订单。
   */
  private async persistOrder(bundle: CreateBundleInput): Promise<OrderEntity> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.mapper.createBundle(bundle);
      } catch (err) {
        if (!isDuplicateKey(err) || attempt >= ORDER_NO_MAX_ATTEMPTS) {
          throw err;
        }
        // 整笔事务已回滚，换新单号后重放
        const nextNo = this.createNo('WD');
        bundle.order.orderNo = nextNo;
        bundle.event.orderNo = nextNo;
      }
    }
  }

  /** 流转后重读，保证返回体与库内一致；重读失败时用已同步的就地修改兜底 */
  private async reload(
    userId: string,
    orderNo: string,
    fallback: OrderEntity,
  ): Promise<OrderEntity> {
    return (await this.mapper.findOwned(userId, orderNo)) ?? fallback;
  }

  /** 过滤值归一化：'ALL' / 空 → 不过滤；非法值直接报参数错误 */
  private normalizeFilter(
    value: string | undefined,
    allowed: Set<string>,
    label: string,
  ): string | undefined {
    const raw = String(value ?? '').trim();
    if (!raw || raw === 'ALL') {
      return undefined;
    }
    if (!allowed.has(raw)) {
      throw new ApiError(1004, `${label}不合法`);
    }
    return raw;
  }

  private requireId(value: string | undefined, label: string): string {
    const id = String(value ?? '').trim();
    if (!/^\d+$/.test(id) || id === '0') {
      throw new ApiError(1004, `缺少有效的${label}`);
    }
    return id;
  }

  /**
   * 日期校验。只查格式是不够的：`2026-99-99` 能过正则，
   * 但 `Date.parse` 返回 NaN，会让 diffDays 算出 NaN 天数并写进
   * `nights INT UNSIGNED NOT NULL`，同时绕过 `nights < 1` 的守卫。
   * 这里用「解析后再格式化回去是否一致」来确认日期真实存在。
   */
  private requireDate(value: string | undefined, label: string): string {
    const date = String(value ?? '').trim();
    if (!DATE_PATTERN.test(date)) {
      throw new ApiError(1004, `${label}格式应为 YYYY-MM-DD`);
    }
    const parsed = Date.parse(`${date}T00:00:00Z`);
    if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== date) {
      throw new ApiError(1004, `${label}不是有效日期`);
    }
    return date;
  }

  /** 取正整数，非法或缺省时回落；超出 INT UNSIGNED 直接报错而非写坏库 */
  private positiveInt(value: number | undefined, fallback: number): number {
    const num = Number(value);
    const base = Number.isInteger(num) && num > 0 ? num : fallback;
    if (!Number.isInteger(base) || base < 1 || base > MAX_UINT32) {
      throw new ApiError(1004, '数量不合法');
    }
    return base;
  }

  /** 文本列守卫：必填校验 + 长度上限（超长会变成 MySQL 1406 → 500） */
  private clip(value: unknown, label: string, max: number, required = false): string {
    const text = String(value ?? '').trim();
    if (required && !text) {
      throw new ApiError(1004, `${label}不能为空`);
    }
    if (text.length > max) {
      throw new ApiError(1004, `${label}长度不能超过 ${max} 个字符`);
    }
    return text;
  }

  /** 列表入参归一化：非数组直接报参数错误，避免 .map / for-of 抛 TypeError 变成 500 */
  private toStringArray(value: unknown): string[] {
    if (value === undefined || value === null) {
      return [];
    }
    if (!Array.isArray(value)) {
      throw new ApiError(1004, 'cartItemIds 必须是数组');
    }
    return value.map((id) => String(id));
  }

  /** 两个 YYYY-MM-DD 相差的天数 */
  private diffDays(from: string, to: string): number {
    const start = Date.parse(`${from}T00:00:00Z`);
    const end = Date.parse(`${to}T00:00:00Z`);
    return Math.round((end - start) / 86400000);
  }

  /** 金额保留两位，与 DECIMAL(10,2) 对齐 */
  private round(value: number): number {
    return Number(value.toFixed(2));
  }

  /** 单号：前缀 + 展示时区 yymmdd + 时间戳后 8 位 + 3 位随机，防同毫秒撞唯一键 */
  private createNo(prefix: string): string {
    const now = new Date(Date.now() + TZ_OFFSET_MS);
    const ymd =
      String(now.getUTCFullYear()).slice(2) +
      String(now.getUTCMonth() + 1).padStart(2, '0') +
      String(now.getUTCDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `${prefix}${ymd}${Date.now().toString().slice(-8)}${rand}`;
  }

  /** 按展示时区把下单时间格式化为 YYYY-MM-DD（Order.date） */
  private toDateString(value: Date): string {
    const shifted = new Date(new Date(value).getTime() + TZ_OFFSET_MS);
    return [
      shifted.getUTCFullYear(),
      String(shifted.getUTCMonth() + 1).padStart(2, '0'),
      String(shifted.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  /** 实体 → 前端 Order 契约 */
  private toOrder(order: OrderEntity): OrderVo {
    return {
      orderNo: order.orderNo,
      type: order.type,
      status: order.status,
      title: order.title,
      cover: order.cover,
      summary: order.summary,
      amount: Number(order.amount),
      qty: Number(order.qty),
      date: this.toDateString(order.createdAt),
      shop: order.shopName,
    };
  }
}
=======
        credential: `mock-${order.orderNo}`,
        paidAt: new Date(),
      });
      await paymentRepo.save(payment);

      order.status = 'PAID';
      order.paidAt = new Date();
      return orderRepo.save(order);
    });
  }

  /**
   * 取消：仅做状态流转，库存回补由业务模块（m3）在其自己的 cancel 入口完成。
   */
  async cancelOrder(
    orderNo: string,
    userId: string,
    em?: EntityManager,
  ): Promise<OrderEntity> {
    const repo = this.orderRepoOf(em);
    const order = await repo.findOne({ where: { orderNo, userId } });
    if (!order) throw new ApiError(1003, '订单不存在', 404);
    if (!['UNPAID', 'PAID', 'CONFIRMED'].includes(order.status)) {
      throw new ApiError(1004, `订单状态 ${order.status} 不可取消`);
    }
    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    order.cancelReason = order.cancelReason || '用户取消';
    return repo.save(order);
  }
}
>>>>>>> origin/lanub/v0911
