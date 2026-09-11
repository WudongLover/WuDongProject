/**
 * 【m2-meal 模块】餐位预订业务逻辑
 *
 * 餐饮预订不需要支付：建单即 CONFIRMED，不产生支付记录。
 * 余量降级：不读/不扣 wudong_m2_slot_quota，只把时段/日期/人数/联系人写入 m2_order_ext。
 * 跨模块只走 Service：建单委托 order 模块的 OrderService，并在同一事务内写扩展表。
 */
import { Inject, Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiError } from '../../m5-community/error/api_error';
import { OrderService } from '../../order/service/order_service';
import { MealOrderExtEntity } from '../entity/order_ext_entity';
import { RestaurantMapper } from '../mapper/restaurant_mapper';

/** 餐位预订入参（结构化预订参数，userId 由 controller 从鉴权上下文注入） */
export interface MealBookingInput {
  restaurantId: string | number;
  slotId: string | number;
  diningDate: string;
  guests: number;
  contactName: string;
  contactPhone: string;
}

const PHONE_RE = /^1\d{10}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

@Provide()
export class MealBookingService {
  @Inject()
  orderService!: OrderService;

  @Inject()
  mapper!: RestaurantMapper;

  @InjectDataSource('default')
  dataSource!: DataSource;

  async create(userId: string, body: MealBookingInput) {
    const restaurantId = Number(body?.restaurantId);
    const slotId = Number(body?.slotId);
    const diningDate = String(body?.diningDate || '');
    const guests = Number(body?.guests);
    const contactName = String(body?.contactName || '').trim();
    const contactPhone = String(body?.contactPhone || '').trim();

    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      throw new ApiError(1004, '参数错误：餐厅 ID 不合法');
    }
    if (!Number.isInteger(slotId) || slotId <= 0) {
      throw new ApiError(1004, '请选择用餐时段');
    }
    if (!DATE_RE.test(diningDate) || Number.isNaN(new Date(diningDate).getTime())) {
      throw new ApiError(1004, '请选择正确的到店日期');
    }
    if (!Number.isInteger(guests) || guests < 1) {
      throw new ApiError(1004, '用餐人数至少 1 人');
    }
    if (!contactName) {
      throw new ApiError(1004, '请填写联系人姓名');
    }
    if (!PHONE_RE.test(contactPhone)) {
      throw new ApiError(1004, '请填写正确的 11 位手机号');
    }

    const restaurant = await this.mapper.findById(restaurantId);
    if (!restaurant || restaurant.status !== 'ENABLED') {
      throw new ApiError(1003, '餐厅不存在或已歇业', 404);
    }
    // 时段必须属于该餐厅，防止用别家时段 ID 下单
    const slot = await this.mapper.findSlot(slotId, restaurantId);
    if (!slot) {
      throw new ApiError(1004, '所选时段不存在，请重新选择');
    }

    // 金额服务端重算：人均 × 人数（到店预估，不发起支付）
    const amount = Number(restaurant.pricePerCapita) * guests;

    return this.dataSource.transaction(async (em) => {
      // 建单即确认（MEAL 无需支付）
      const order = await this.orderService.createOrder(
        {
          userId,
          type: 'MEAL',
          status: 'CONFIRMED',
          title: `${restaurant.name} · 餐位预订`,
          cover: restaurant.cover,
          summary: `${diningDate} ${slot.name} · ${guests} 人 · ${contactName}`,
          amount,
          qty: guests,
          shopName: restaurant.name,
          merchantId: String(restaurant.merchantId),
        },
        em,
      );
      await em.getRepository(MealOrderExtEntity).save(
        em.getRepository(MealOrderExtEntity).create({
          orderId: order.id,
          restaurantId,
          slotId,
          diningDate,
          diningTime: slot.name,
          guests,
          contactName,
          contactPhone,
        }),
      );
      return order;
    });
  }
}