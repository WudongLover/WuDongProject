/**
 * 【m4-ticket 模块】门票 / 路线下单业务逻辑
 *
 * 职责边界：
 * - 票档库存、路线销量、行订单扩展（wudong_m4_order_ext）属于 m4 的业务数据，在本模块事务内完成；
 * - 订单主表由公共 order 模块负责，本服务在同一事务内调用 OrderService.createOrder(input, em)；
 * - 金额、标题、封面、店铺名一律服务端重算，不信任前端传入值。
 *
 * 库存口径：门票按票档 stock 条件扣减；路线表无库存列，只累加销量。
 */
import { Inject, Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { ApiError } from '../../m5-community/error/api_error';
import { OrderEntity } from '../../order/entity/order_entity';
import { OrderService } from '../../order/service/order_service';
import { RouteEntity } from '../entity/route_entity';
import { ScenicEntity } from '../entity/scenic_entity';
import { TicketEntity } from '../entity/ticket_entity';
import { TicketOrderExtEntity } from '../entity/order_ext_entity';

/** 行下单入参（userId 由 controller 从鉴权上下文注入） */
export interface TicketBookingInput {
  ticketId?: string | number;
  routeId?: string | number;
  travelDate: string;
  /** 前端沿用 qty；与 guests 等价 */
  qty?: number | string;
  guests?: number | string;
  contactName: string;
  contactPhone: string;
}

const PHONE_RE = /^1\d{10}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_GUESTS = 50;
const PAY_EXPIRE_MS = 30 * 60 * 1000;

@Provide()
export class TicketBookingService {
  @Inject()
  orderService!: OrderService;

  @InjectDataSource('default')
  dataSource!: DataSource;

  /** 门票 / 路线下单：建 UNPAID 订单 + 写行订单扩展，门票同时扣减票档库存 */
  async create(
    userId: string,
    type: 'TICKET' | 'ROUTE',
    body: TicketBookingInput,
  ): Promise<OrderEntity> {
    const travelDate = String(body?.travelDate || '');
    const guests = Number(body?.qty ?? body?.guests);
    const contactName = String(body?.contactName || '').trim();
    const contactPhone = String(body?.contactPhone || '').trim();

    this.assertCommon(travelDate, guests, contactName, contactPhone);

    return this.dataSource.transaction(async (em) =>
      type === 'TICKET'
        ? this.createTicketOrder(em, userId, body, {
            travelDate,
            guests,
            contactName,
            contactPhone,
          })
        : this.createRouteOrder(em, userId, body, {
            travelDate,
            guests,
            contactName,
            contactPhone,
          }),
    );
  }

  /** 取消门票订单：回补票档库存并置 CANCELLED（同事务）；路线无库存无需回补 */
  async release(order: OrderEntity): Promise<OrderEntity> {
    return this.dataSource.transaction(async (em) => {
      const ext = await em.getRepository(TicketOrderExtEntity).findOne({
        where: { orderId: order.id },
      });
      if (ext?.ticketId) {
        await em.query('UPDATE wudong_m4_ticket SET stock = stock + ? WHERE id = ?', [
          Number(order.qty),
          ext.ticketId,
        ]);
      }
      return this.orderService.cancelOrder(order.orderNo, order.userId, em);
    });
  }

  private async createTicketOrder(
    em: EntityManager,
    userId: string,
    body: TicketBookingInput,
    common: { travelDate: string; guests: number; contactName: string; contactPhone: string },
  ): Promise<OrderEntity> {
    const ticketId = String(body?.ticketId ?? '');
    if (!/^\d+$/.test(ticketId) || Number(ticketId) <= 0) {
      throw new ApiError(1004, '参数错误：票档 ID 不合法');
    }
    const ticket = await em.getRepository(TicketEntity).findOne({
      where: { id: ticketId },
    });
    if (!ticket) {
      throw new ApiError(1003, '票档不存在或已停售', 404);
    }
    const scenic = await em.getRepository(ScenicEntity).findOne({
      where: { id: String(ticket.scenicId) },
    });
    if (!scenic || scenic.status !== 'ENABLED') {
      throw new ApiError(1003, '景区不存在或已停售', 404);
    }

    const res: any = await em.query(
      'UPDATE wudong_m4_ticket SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [common.guests, ticketId, common.guests],
    );
    if (!res || res.affectedRows !== 1) {
      throw new ApiError(3002, `票档库存不足，仅剩 ${Number(ticket.stock)} 张`);
    }

    const order = await this.orderService.createOrder(
      {
        userId,
        type: 'TICKET',
        status: 'UNPAID',
        title: `${scenic.name} · ${ticket.name}`,
        cover: scenic.cover,
        summary: `${common.travelDate} 入园 · ${common.guests} 人 · ${common.contactName}`,
        amount: Number(ticket.price) * common.guests,
        qty: common.guests,
        shopName: scenic.name,
        merchantId: '0',
        expireAt: new Date(Date.now() + PAY_EXPIRE_MS),
      },
      em,
    );

    await this.saveExt(em, order.id, {
      scenicId: String(ticket.scenicId),
      ticketId,
      routeId: null,
      ...common,
    });
    return order;
  }

  private async createRouteOrder(
    em: EntityManager,
    userId: string,
    body: TicketBookingInput,
    common: { travelDate: string; guests: number; contactName: string; contactPhone: string },
  ): Promise<OrderEntity> {
    const routeId = String(body?.routeId ?? '');
    if (!/^\d+$/.test(routeId) || Number(routeId) <= 0) {
      throw new ApiError(1004, '参数错误：路线 ID 不合法');
    }
    const route = await em.getRepository(RouteEntity).findOne({
      where: { id: routeId },
    });
    if (!route || route.status !== 'ON_SHELF') {
      throw new ApiError(1003, '路线不存在或已停售', 404);
    }

    await em.query('UPDATE wudong_m4_route SET sales = sales + ? WHERE id = ?', [
      common.guests,
      routeId,
    ]);

    const order = await this.orderService.createOrder(
      {
        userId,
        type: 'ROUTE',
        status: 'UNPAID',
        title: route.title,
        cover: route.cover,
        summary: `${common.travelDate} 出发 · ${common.guests} 人 · ${route.departure}`,
        amount: Number(route.price) * common.guests,
        qty: common.guests,
        shopName: '乌东旅行社',
        merchantId: String(route.merchantId),
        expireAt: new Date(Date.now() + PAY_EXPIRE_MS),
      },
      em,
    );

    await this.saveExt(em, order.id, {
      scenicId: null,
      ticketId: null,
      routeId,
      ...common,
    });
    return order;
  }

  private async saveExt(
    em: EntityManager,
    orderId: string,
    data: {
      scenicId: string | null;
      ticketId: string | null;
      routeId: string | null;
      travelDate: string;
      guests: number;
      contactName: string;
      contactPhone: string;
    },
  ) {
    const repo = em.getRepository(TicketOrderExtEntity);
    await repo.save(repo.create({ orderId, ...data }));
  }

  private assertCommon(
    travelDate: string,
    guests: number,
    contactName: string,
    contactPhone: string,
  ) {
    if (!DATE_RE.test(travelDate) || Number.isNaN(new Date(travelDate).getTime())) {
      throw new ApiError(1004, '请选择正确的出游日期');
    }
    if (travelDate < this.today()) {
      throw new ApiError(1004, '出游日期不能早于今天');
    }
    if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) {
      throw new ApiError(1004, `出行人数需为 1-${MAX_GUESTS} 人`);
    }
    if (!contactName) {
      throw new ApiError(1004, '请填写联系人姓名');
    }
    if (!PHONE_RE.test(contactPhone)) {
      throw new ApiError(1004, '请填写正确的 11 位手机号');
    }
  }

  private today(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
