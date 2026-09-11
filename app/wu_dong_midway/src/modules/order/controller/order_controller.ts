/**
 * 【order 模块】订单接口（C 端）
 * 前缀 /api/app/order，统一响应 { code, message, data }（对齐前端契约）
 * 鉴权：auth_middleware 对 /api/app/order 全方法校验 Bearer token，注入 ctx.userId
 */
import { Body, Controller, Get, Inject, Param, Post, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { OrderService } from '../service/order_service';

@Controller('/api/app/order')
export class OrderController {
  @Inject()
  ctx!: Context;

  @Inject()
  service!: OrderService;

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

  /** 取消订单：状态置 CANCELLED（库存回补由业务模块方入口负责） */
  @Post('/cancel')
  async cancel(@Body('orderNo') orderNo: string) {
    return this.ok(await this.service.cancelOrder(orderNo, this.userId()));
  }
}