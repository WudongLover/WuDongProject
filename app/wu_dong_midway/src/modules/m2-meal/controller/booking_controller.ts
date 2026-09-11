/**
 * 【m2-meal 模块】餐位预订 C 端接口
 * 前缀 /api/app/m2/booking，写操作经 auth_middleware 校验 Bearer token，注入 ctx.userId
 * 统一响应 { code, message, data }（对齐前端契约）
 */
import { Body, Controller, Inject, Post } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { MealBookingInput, MealBookingService } from '../service/booking_service';

@Controller('/api/app/m2/booking')
export class MealBookingController {
  @Inject()
  ctx!: Context;

  @Inject()
  service!: MealBookingService;

  private ok<T>(data: T) {
    return { code: 0, message: 'ok', data };
  }

  /** 餐位预订：建单即 CONFIRMED，返回订单（前端据此跳预订成功页） */
  @Post('/create')
  async create(@Body() body: MealBookingInput) {
    const userId = String((this.ctx as any).userId);
    return this.ok(await this.service.create(userId, body ?? ({} as MealBookingInput)));
  }
}