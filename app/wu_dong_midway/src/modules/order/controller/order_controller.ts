/**
 * 【order 模块】订单公共链路接口（wudong_common_order）
 * controller 层：薄层，参数绑定 + 调用 service
 *
 * 路由前缀沿用前端 m4-order.ts 已写定的 /api/app/m4/order，
 * 该前缀在 AuthMiddleware 中被显式豁免验签，身份解析见 userId()。
 */
import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { CreateOrderPayload, OrderService } from '../service/order_service';

@Controller('/api/app/m4/order')
export class OrderController {
  @Inject()
  service: OrderService;

  @Inject()
  ctx: Context;

  @Post('/create')
  async create(@Body() payload: CreateOrderPayload) {
    return this.ok(await this.service.create(this.userId(), payload));
  }

  @Get('/list')
  async list(@Query('type') type: string, @Query('status') status: string) {
    return this.ok(await this.service.list(this.userId(), { type, status }));
  }

  @Post('/pay')
  async pay(@Body('orderNo') orderNo: string) {
    return this.ok(await this.service.pay(this.userId(), orderNo));
  }

  @Post('/cancel')
  async cancel(@Body('orderNo') orderNo: string) {
    return this.ok(await this.service.cancel(this.userId(), orderNo));
  }

  @Post('/refund')
  async refund(@Body('orderNo') orderNo: string) {
    return this.ok(await this.service.refund(this.userId(), orderNo));
  }

  /**
   * 身份解析，与 m1 购物车、m5 社区保持同一套约定：
   * 1) AuthMiddleware 已验签并通过时用 ctx.userId（当前 order 路径被豁免，通常取不到）
   * 2) 请求头 x-user-id
   * 3) DEMO_USER_ID，缺省 1
   */
  private userId(): string {
    const verified = (this.ctx as unknown as { userId?: string }).userId;
    if (verified) {
      return String(verified);
    }
    const raw = this.ctx.headers['x-user-id'];
    const id = Number(Array.isArray(raw) ? raw[0] : raw);
    return Number.isInteger(id) && id > 0 ? String(id) : String(process.env.DEMO_USER_ID || 1);
  }

  private ok<T>(data: T) {
    return { code: 0, message: 'ok', data };
  }
}
