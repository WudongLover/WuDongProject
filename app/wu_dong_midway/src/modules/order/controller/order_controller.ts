/**
 * 【order 模块】订单接口（C 端）
 * 前缀 /api/app/order，统一响应 { code, message, data }（对齐前端契约）
 * 鉴权：auth_middleware 对 /api/app/order 全方法校验 Bearer token，注入 ctx.userId
 */
import { Body, Controller, Get, Inject, Param, Post, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { OrderFacadeService } from '../service/order_facade_service';
import { OrderService } from '../service/order_service';

@Controller('/api/app/order')
export class OrderController {
  @Inject()
  ctx!: Context;

  @Inject()
  service!: OrderService;

  @Inject()
  facade!: OrderFacadeService;

  private ok<T>(data: T) {
    return { code: 0, message: 'ok', data };
  }

  private userId(): string {
    return String((this.ctx as any).userId);
  }

  /** 订单列表：?type=&status= 可选过滤 */
  @Get('/list')
  async list(@Query('type') type?: string, @Query('status') status?: string) {
    return this.ok(await this.service.list(this.userId(), { type, status }));
  }

  /**
   * 创建订单：购物车结算（GOODS/SPECIALTY）与门票/路线下单（TICKET/ROUTE）。
   * 金额与库存一律服务端重算，前端传入的 amount/title 等展示字段被忽略。
   */
  @Post('/create')
  async create(@Body() body: any) {
    return this.ok(await this.facade.create(this.userId(), body ?? {}));
  }

  /** 订单详情：主表 + 支付记录 */
  @Get('/detail/:orderNo')
  async detail(@Param('orderNo') orderNo: string) {
    return this.ok(await this.service.detail(orderNo, this.userId()));
  }

  /** mock 支付：写支付记录并置 PAID（幂等） */
  @Post('/pay')
  async pay(@Body('orderNo') orderNo: string) {
    return this.ok(await this.service.pay(orderNo, this.userId()));
  }

  /** 取消订单：实物回补 SKU 库存、门票回补票档库存，其余仅状态流转 */
  @Post('/cancel')
  async cancel(@Body('orderNo') orderNo: string) {
    return this.ok(await this.facade.cancel(orderNo, this.userId()));
  }
}
