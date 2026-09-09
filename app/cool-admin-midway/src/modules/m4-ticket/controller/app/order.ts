import { BaseController, CoolTag, CoolUrlTag, TagTypes } from '@cool-midway/core';
import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { CreateOrderPayload, M4OrderService } from '../../service/order';

@Controller('/app/m4/order')
@CoolUrlTag()
export class AppM4OrderController extends BaseController {
  @Inject()
  orderService: M4OrderService;

  @Inject()
  ctx;

  private userId(): number {
    return Number(this.ctx.user?.id || this.ctx.get('x-user-id') || 1);
  }

  @Post('/create', { summary: '创建行程订单' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async create(@Body() payload: CreateOrderPayload) {
    return this.ok(await this.orderService.create(this.userId(), payload));
  }

  @Get('/list', { summary: '行程订单列表' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async listOrders(@Query('type') type: string) {
    return this.ok(await this.orderService.list(this.userId(), { type }));
  }

  @Post('/pay', { summary: '支付行程订单' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async pay(@Body('orderNo') orderNo: string) {
    return this.ok(await this.orderService.pay(this.userId(), orderNo));
  }

  @Post('/cancel', { summary: '取消行程订单' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async cancel(@Body('orderNo') orderNo: string) {
    return this.ok(await this.orderService.cancel(this.userId(), orderNo));
  }

  @Post('/refund', { summary: '申请行程订单退款' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async refund(@Body('orderNo') orderNo: string) {
    return this.ok(await this.orderService.refund(this.userId(), orderNo));
  }
}
