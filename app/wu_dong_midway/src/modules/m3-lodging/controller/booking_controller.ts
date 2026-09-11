/**
 * 【m3-lodging 模块】民宿预订 C 端接口
 * 前缀 /api/app/m3/booking，写操作经 auth_middleware 校验 Bearer token，注入 ctx.userId
 * 统一响应 { code, message, data }（对齐前端契约）
 */
import { Body, Controller, Inject, Post } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import {
  LodgingBookingInput,
  LodgingBookingService,
} from '../service/booking_service';

@Controller('/api/app/m3/booking')
export class LodgingBookingController {
  @Inject()
  ctx!: Context;

  @Inject()
  service!: LodgingBookingService;

  private ok<T>(data: T) {
    return { code: 0, message: 'ok', data };
  }

  /** 民宿预订：建单 UNPAID 并预占房态，返回订单（前端据此跳模拟收银台） */
  @Post('/create')
  async create(@Body() body: LodgingBookingInput) {
    const userId = String((this.ctx as any).userId);
    return this.ok(
      await this.service.create(userId, body ?? ({} as LodgingBookingInput)),
    );
  }

  /** 取消未支付订单：回补房态并置 CANCELLED */
  @Post('/cancel')
  async cancel(@Body('orderNo') orderNo: string) {
    const userId = String((this.ctx as any).userId);
    return this.ok(await this.service.cancel(userId, orderNo));
  }
}