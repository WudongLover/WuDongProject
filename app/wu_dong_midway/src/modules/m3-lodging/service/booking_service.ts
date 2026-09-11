/**
 * 【m3-lodging 模块】民宿预订业务逻辑
 *
 * 住宿需要预付款：建单为 UNPAID（写 expire_at），库存「下单即预占、取消手动释放」。
 * 房态按 wudong_m3_room_calendar 逐日管理，金额/库存以服务端日历为准，不信前端。
 * 跨模块只走 Service：建单/取消委托 order 模块，与房态扣减放在同一事务内保证原子性。
 */
import { Inject, Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiError } from '../../m5-community/error/api_error';
import { OrderService } from '../../order/service/order_service';
import { HomestayEntity } from '../entity/homestay_entity';
import { LodgingOrderExtEntity } from '../entity/order_ext_entity';
import { RoomTypeEntity } from '../entity/room_type_entity';
import {
  addDays,
  daysBetween,
  RoomCalendarService,
  todayStr,
} from './room_calendar_service';

/** 民宿预订入参（结构化预订参数，userId 由 controller 从鉴权上下文注入） */
export interface LodgingBookingInput {
  homestayId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  contactName: string;
  contactPhone: string;
}

const PHONE_RE = /^1\d{10}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** 最多可订晚数，避免一次性长期锁定房态 */
const MAX_NIGHTS = 30;
/** 未支付订单的支付截止时长（毫秒）：30 分钟 */
const PAY_EXPIRE_MS = 30 * 60 * 1000;

@Provide()
export class LodgingBookingService {
  @Inject()
  orderService!: OrderService;

  @Inject()
  roomCalendar!: RoomCalendarService;

  @InjectDataSource('default')
  dataSource!: DataSource;

  async create(userId: string, body: LodgingBookingInput) {
    const homestayId = String(body?.homestayId || '');
    const roomTypeId = String(body?.roomTypeId || '');
    const checkInDate = String(body?.checkInDate || '');
    const checkOutDate = String(body?.checkOutDate || '');
    const guests = Number(body?.guests);
    const contactName = String(body?.contactName || '').trim();
    const contactPhone = String(body?.contactPhone || '').trim();

    if (!/^\d+$/.test(homestayId)) {
      throw new ApiError(1004, '参数错误：民宿 ID 不合法');
    }
    if (!/^\d+$/.test(roomTypeId)) {
      throw new ApiError(1004, '请选择房型');
    }
    if (!DATE_RE.test(checkInDate) || !DATE_RE.test(checkOutDate)) {
      throw new ApiError(1004, '请选择正确的入住和离店日期');
    }
    const nights = daysBetween(checkInDate, checkOutDate);
    if (nights < 1) {
      throw new ApiError(1004, '离店日期需晚于入住日期');
    }
    if (nights > MAX_NIGHTS) {
      throw new ApiError(1004, `一次最多预订 ${MAX_NIGHTS} 晚`);
    }
    if (!Number.isInteger(guests) || guests < 1) {
      throw new ApiError(1004, '入住人数至少 1 人');
    }
    if (!contactName) {
      throw new ApiError(1004, '请填写入住人姓名');
    }
    if (!PHONE_RE.test(contactPhone)) {
      throw new ApiError(1004, '请填写正确的 11 位手机号');
    }

    // 入住日期不能早于今天
    if (checkInDate < todayStr()) {
      throw new ApiError(1004, '入住日期不能早于今天');
    }

    const stayDates = Array.from({ length: nights }, (_, i) =>
      addDays(checkInDate, i),
    );

    return this.dataSource.transaction(async (em) => {
      const homestay = await em.findOne(HomestayEntity, {
        where: { id: homestayId },
      });
      if (!homestay || homestay.status !== 'ENABLED') {
        throw new ApiError(1003, '民宿不存在或已歇业', 404);
      }
      const roomType = await em.findOne(RoomTypeEntity, {
        where: { id: roomTypeId },
      });
      // 房型必须属于该民宿
      if (!roomType || String(roomType.homestayId) !== homestayId) {
        throw new ApiError(1004, '所选房型不存在，请重新选择');
      }
      if (guests > roomType.maxGuests) {
        throw new ApiError(1004, `该房型最多入住 ${roomType.maxGuests} 人`);
      }

      // 一次性取出入住区间的房态，按日期建索引；
      // 日历行缺失时按房型总库存补齐（空表/未覆盖日期不再一律判满房）
      const calendars = await this.roomCalendar.ensure(em, roomType, stayDates);
      const calMap = new Map(calendars.map((c) => [c.date, c]));

      // 服务端逐晚算价并预检（缺行/停售/满房都不可订）
      let amount = 0;
      for (const d of stayDates) {
        const cal = calMap.get(d);
        if (!cal || cal.closed === 1 || cal.stock < 1) {
          throw new ApiError(3002, `所选日期中 ${d} 已满房或停售，请调整日期`);
        }
        amount += Number(roomType.price) + Number(cal.priceDelta);
      }

      // 条件更新兜底并发：仅当当日有房且未停售时扣减，任一晚失败整单回滚
      for (const d of stayDates) {
        const res: any = await em.query(
          'UPDATE wudong_m3_room_calendar SET stock = stock - 1 WHERE room_type_id = ? AND `date` = ? AND stock >= 1 AND closed = 0',
          [roomTypeId, d],
        );
        if (!res || res.affectedRows !== 1) {
          throw new ApiError(3002, `所选日期中 ${d} 已满房，请调整日期`);
        }
      }

      const order = await this.orderService.createOrder(
        {
          userId,
          type: 'LODGING',
          status: 'UNPAID',
          title: `${homestay.name} · ${roomType.name}`,
          cover: homestay.cover,
          summary: `${checkInDate} 入住 · ${checkOutDate} 离店 · ${nights} 晚 · ${contactName}`,
          amount,
          qty: nights,
          shopName: homestay.name,
          merchantId: String(homestay.merchantId),
          expireAt: new Date(Date.now() + PAY_EXPIRE_MS),
        },
        em,
      );

      await em.getRepository(LodgingOrderExtEntity).save(
        em.getRepository(LodgingOrderExtEntity).create({
          orderId: order.id,
          homestayId,
          roomTypeId,
          checkInDate,
          checkOutDate,
          nights,
          guests,
          contactName,
          contactPhone,
        }),
      );

      return order;
    });
  }

  /**
   * 取消未支付住宿单：逐晚回补房态 + 订单置 CANCELLED（同一事务）。
   * 已支付订单本期不走线上退款，拒绝取消。
   */
  async cancel(userId: string, orderNo: string) {
    return this.dataSource.transaction(async (em) => {
      const order = await this.orderService.detail(orderNo, userId);
      if (!order) {
        throw new ApiError(1003, '订单不存在', 404);
      }
      if (order.type !== 'LODGING') {
        throw new ApiError(1004, '仅住宿订单可在此取消');
      }
      if (order.status !== 'UNPAID') {
        throw new ApiError(1004, '仅未支付订单可取消，已支付订单请联系客服');
      }

      const ext = await em.findOne(LodgingOrderExtEntity, {
        where: { orderId: order.id },
      });
      if (ext) {
        const stayDates = Array.from({ length: ext.nights }, (_, i) =>
          addDays(ext.checkInDate, i),
        );
        for (const d of stayDates) {
          await em.query(
            'UPDATE wudong_m3_room_calendar SET stock = stock + 1 WHERE room_type_id = ? AND `date` = ?',
            [ext.roomTypeId, d],
          );
        }
      }

      return this.orderService.cancelOrder(orderNo, userId, em);
    });
  }
}
