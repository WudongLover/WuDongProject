/**
 * 【order 模块】C 端下单 / 取消分发入口
 *
 * order 模块只负责路由与订单主表流转，具体业务（购物车库存、票档库存、行订单扩展）
 * 由对应模块在自己的事务内完成，通过注入对方 Service 调用（遵守"跨模块只走 Service"）。
 */
import { Inject, Provide } from '@midwayjs/core';
import { ApiError } from '../../m5-community/error/api_error';
import { CartCheckoutService } from '../../m1-goods/service/checkout_service';
import { TicketBookingService } from '../../m4-ticket/service/booking_service';
import { OrderEntity } from '../entity/order_entity';
import { OrderService } from './order_service';

@Provide()
export class OrderFacadeService {
  @Inject()
  orderService!: OrderService;

  @Inject()
  cartCheckout!: CartCheckoutService;

  @Inject()
  ticketBooking!: TicketBookingService;

  /**
   * 创建订单：
   * - GOODS / SPECIALTY：购物车结算（cartItemIds）或立即购买（items）
   * - TICKET / ROUTE：门票、路线下单（ticketId / routeId + 出游信息）
   */
  async create(userId: string, body: any): Promise<OrderEntity> {
    const type = String(body?.type || '').toUpperCase();
    if (type === 'GOODS' || type === 'SPECIALTY') {
      if (Array.isArray(body?.cartItemIds) && body.cartItemIds.length) {
        // 带上明细一起返回：收银弹窗要按商品逐项展示
        return this.orderService.withItems(
          await this.cartCheckout.createFromCart(userId, body.cartItemIds),
        );
      }
      if (Array.isArray(body?.items) && body.items.length) {
        return this.orderService.withItems(
          await this.cartCheckout.createDirect(userId, body.items),
        );
      }
      throw new ApiError(1004, '请先选择要购买的商品');
    }
    if (type === 'TICKET' || type === 'ROUTE') {
      return this.ticketBooking.create(userId, type, body ?? {});
    }
    throw new ApiError(1004, '不支持的订单类型');
  }

  /**
   * 取消订单：实物回补 SKU 库存、门票回补票档库存，其余只做状态流转。
   * 住宿单前端仍走 m3 预订入口（同事务回补房态），不经过这里。
   */
  async cancel(orderNo: string, userId: string): Promise<OrderEntity> {
    if (!orderNo) {
      throw new ApiError(1004, '参数错误：订单号不能为空');
    }
    const order = await this.orderService.findByOrderNo(orderNo, userId);
    if (!order) {
      throw new ApiError(1003, '订单不存在', 404);
    }
    if (order.type === 'GOODS' || order.type === 'SPECIALTY') {
      return this.cartCheckout.release(order);
    }
    if (order.type === 'TICKET') {
      return this.ticketBooking.release(order);
    }
    return this.orderService.cancelOrder(orderNo, userId);
  }
}
