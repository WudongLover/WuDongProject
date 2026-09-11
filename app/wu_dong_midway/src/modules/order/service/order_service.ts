/**
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
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ApiError } from '../../m5-community/error/api_error';
import { OrderEntity, OrderStatus, OrderType } from '../entity/order_entity';
import { OrderItemEntity } from '../entity/order_item_entity';
import { PaymentEntity } from '../entity/payment_entity';

/** 建单入参：字段与 wudong_common_order 列对齐，业务模块负责组装展示快照 */
export interface CreateOrderInput {
  userId: string;
  type: OrderType;
  title: string;
  cover?: string;
  summary?: string;
  amount: number;
  qty?: number;
  shopName?: string;
  merchantId?: string;
  /** 初始状态：住宿 UNPAID（默认），餐饮 CONFIRMED */
  status?: OrderStatus;
  /** 支付截止时间：住宿下单时写入 now+30min */
  expireAt?: Date;
}

@Provide()
export class OrderService {
  @InjectDataSource('default')
  dataSource: DataSource;

  @InjectEntityModel(OrderEntity)
  orderRepo: Repository<OrderEntity>;

  @InjectEntityModel(PaymentEntity)
  paymentRepo: Repository<PaymentEntity>;

  @InjectEntityModel(OrderItemEntity)
  orderItemRepo: Repository<OrderItemEntity>;

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
    const orders = await this.orderRepo.find({
      where,
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return this.attachItems(orders);
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
    const items = await this.orderItemRepo.find({
      where: { orderId: order.id },
      order: { id: 'ASC' },
    });
    return { ...order, items, payments };
  }

  /**
   * 给订单挂上商品明细（一次批量查询，避免 N+1）。
   * 购物车合并支付只建一张订单，明细在前端按商品逐项展示。
   */
  async withItems(order: OrderEntity): Promise<OrderEntity> {
    return (await this.attachItems([order]))[0];
  }

  private async attachItems(orders: OrderEntity[]): Promise<OrderEntity[]> {
    if (!orders.length) return orders;
    const rows = await this.orderItemRepo.find({
      where: { orderId: In(orders.map((o) => String(o.id))) },
      order: { id: 'ASC' },
    });
    const grouped = new Map<string, OrderItemEntity[]>();
    for (const row of rows) {
      const key = String(row.orderId);
      const list = grouped.get(key) ?? [];
      list.push(row);
      grouped.set(key, list);
    }
    for (const order of orders) {
      (order as any).items = grouped.get(String(order.id)) ?? [];
    }
    return orders;
  }

  /** 按单号取当前用户的订单（供取消/释放库存分发使用） */
  async findByOrderNo(orderNo: string, userId: string): Promise<OrderEntity | null> {
    return this.orderRepo.findOne({ where: { orderNo, userId } });
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
        orderNo: order.orderNo,
        userId,
        amount: order.amount,
        status: 'SUCCESS',
        provider: 'mock',
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
