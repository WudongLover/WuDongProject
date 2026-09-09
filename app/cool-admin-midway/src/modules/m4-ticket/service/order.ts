import { CoolCommException } from '@cool-midway/core';
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { CommonOrderEntity } from '../entity/order';
import { CommonOrderEventEntity } from '../entity/order-event';
import { M4OrderExtEntity } from '../entity/order-ext';
import { CommonPaymentEntity } from '../entity/payment';

export interface CreateOrderPayload {
  type: string;
  title: string;
  cover?: string;
  summary?: string;
  amount: number;
  qty: number;
  shop?: string;
  scenicId?: string | number;
  ticketId?: string | number;
  routeId?: string | number;
  travelDate?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface OrderQuery {
  type?: string;
}

const VALID_TYPES = new Set(['GOODS', 'SPECIALTY', 'MEAL', 'LODGING', 'TICKET', 'ROUTE']);

@Provide()
export class M4OrderService {
  @InjectEntityModel(CommonOrderEntity)
  orderEntity: Repository<CommonOrderEntity>;

  @InjectEntityModel(CommonPaymentEntity)
  paymentEntity: Repository<CommonPaymentEntity>;

  @InjectEntityModel(M4OrderExtEntity)
  orderExtEntity: Repository<M4OrderExtEntity>;

  @InjectEntityModel(CommonOrderEventEntity)
  eventEntity: Repository<CommonOrderEventEntity>;

  private createOrderNo(prefix: string): string {
    const date = new Date();
    const ymd = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    return `${prefix}${ymd}${Date.now().toString().slice(-8)}`;
  }

  private toOrder(order: CommonOrderEntity) {
    return {
      orderNo: order.orderNo,
      type: order.type,
      status: order.status,
      title: order.title,
      cover: order.cover,
      summary: order.summary,
      amount: Number(order.amount),
      qty: order.qty,
      date: order.createdAt.toISOString().slice(0, 10),
      shop: order.shopName,
    };
  }

  async create(userId: number, payload: CreateOrderPayload) {
    if (!VALID_TYPES.has(payload.type)) throw new CoolCommException('订单类型不合法');
    if (!payload.title?.trim() || !Number.isFinite(Number(payload.amount)) || Number(payload.amount) < 0) {
      throw new CoolCommException('订单信息不完整');
    }
    const qty = Number(payload.qty);
    if (!Number.isInteger(qty) || qty < 1) throw new CoolCommException('订单数量不合法');
    if ((payload.type === 'TICKET' || payload.type === 'ROUTE') && !/^\d{4}-\d{2}-\d{2}$/.test(payload.travelDate ?? '')) {
      throw new CoolCommException('出游日期不合法');
    }

    const order = await this.orderEntity.save(this.orderEntity.create({
      orderNo: this.createOrderNo('WD'),
      userId,
      type: payload.type,
      status: 'UNPAID',
      title: payload.title.trim(),
      cover: payload.cover?.trim() || '',
      summary: payload.summary?.trim() || '',
      amount: String(Number(payload.amount)),
      qty,
      shopName: payload.shop?.trim() || '',
      expireAt: new Date(Date.now() + 30 * 60 * 1000),
      paidAt: null,
      cancelledAt: null,
      cancelReason: '',
      refundReason: '',
      refundAmount: null,
    }));

    if (payload.type === 'TICKET' || payload.type === 'ROUTE') {
      await this.orderExtEntity.save(this.orderExtEntity.create({
        orderId: order.id,
        scenicId: payload.scenicId ? Number(payload.scenicId) : null,
        ticketId: payload.ticketId ? Number(payload.ticketId) : null,
        routeId: payload.routeId ? Number(payload.routeId) : null,
        travelDate: payload.travelDate!,
        guests: qty,
        contactName: payload.contactName?.trim() || '',
        contactPhone: payload.contactPhone?.trim() || '',
      }));
    }

    await this.eventEntity.save(this.eventEntity.create({
      orderNo: order.orderNo,
      eventType: 'ORDER_CREATED',
      targetModule: 'm4',
      status: 'PENDING',
      payload: { type: order.type, amount: order.amount },
    }));
    return this.toOrder(order);
  }

  async list(userId: number, query: OrderQuery = {}) {
    const where: { userId: number; type?: string } = { userId };
    if (query.type && query.type !== 'ALL') where.type = query.type;
    const orders = await this.orderEntity.find({ where, order: { id: 'DESC' } });
    return orders.map((order) => this.toOrder(order));
  }

  private async ownedOrder(userId: number, orderNo: string) {
    const order = await this.orderEntity.findOneBy({ orderNo, userId });
    if (!order) throw new CoolCommException('订单不存在');
    return order;
  }

  async pay(userId: number, orderNo: string) {
    const order = await this.ownedOrder(userId, orderNo);
    if (order.status !== 'UNPAID') throw new CoolCommException('订单状态不允许支付');
    const paidAt = new Date();
    order.status = 'PAID';
    order.paidAt = paidAt;
    await this.orderEntity.save(order);
    await this.paymentEntity.save(this.paymentEntity.create({
      payNo: this.createOrderNo('PAY'),
      orderNo: order.orderNo,
      userId,
      amount: order.amount,
      status: 'SUCCESS',
      provider: 'mock',
      credential: `backend-${Date.now()}`,
      paidAt,
    }));
    await this.eventEntity.save(this.eventEntity.create({
      orderNo: order.orderNo,
      eventType: 'ORDER_PAID',
      targetModule: 'm4',
      status: 'PENDING',
      payload: { amount: order.amount },
    }));
    return this.toOrder(order);
  }

  async cancel(userId: number, orderNo: string) {
    const order = await this.ownedOrder(userId, orderNo);
    if (!['UNPAID', 'PAID'].includes(order.status)) throw new CoolCommException('订单状态不允许取消');
    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    await this.orderEntity.save(order);
    await this.eventEntity.save(this.eventEntity.create({
      orderNo: order.orderNo,
      eventType: 'ORDER_CANCELLED',
      targetModule: 'm4',
      status: 'PENDING',
      payload: null,
    }));
    return this.toOrder(order);
  }

  async refund(userId: number, orderNo: string) {
    const order = await this.ownedOrder(userId, orderNo);
    if (!['PAID', 'CONFIRMED'].includes(order.status)) throw new CoolCommException('订单状态不允许退款');
    order.status = 'REFUNDED';
    order.refundAmount = order.amount;
    order.refundReason = '用户申请退款';
    await this.orderEntity.save(order);
    const payment = await this.paymentEntity.findOneBy({ orderNo, userId });
    if (payment) {
      payment.status = 'REFUNDED';
      await this.paymentEntity.save(payment);
    }
    await this.eventEntity.save(this.eventEntity.create({
      orderNo: order.orderNo,
      eventType: 'REFUND_APPROVED',
      targetModule: 'm4',
      status: 'PENDING',
      payload: { amount: order.amount },
    }));
    return this.toOrder(order);
  }
}
