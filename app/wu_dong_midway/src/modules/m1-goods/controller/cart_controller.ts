import { Body, Controller, Del, Get, Inject, Param, Post, Put } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { CartService, AddCartPayload } from '../service/cart_service';

@Controller('/api/cart')
export class CartController {
  @Inject() ctx: Context;
  @Inject() cartService: CartService;
  @Get('/') async list() { return this.ok(await this.cartService.list(this.userId())); }
  @Post('/') async add(@Body() body: AddCartPayload) { return this.ok(await this.cartService.add(this.userId(), body)); }
  @Put('/:id') async update(@Param('id') id: string, @Body() body: { qty?: number; checked?: boolean }) { return this.ok(await this.cartService.update(this.userId(), id, body || {})); }
  @Del('/:id') async remove(@Param('id') id: string) { return this.ok(await this.cartService.remove(this.userId(), id)); }
  @Post('/check') async check() { return this.ok(await this.cartService.check(this.userId())); }
  private userId() { const raw = this.ctx.headers['x-user-id']; const id = Number(Array.isArray(raw) ? raw[0] : raw); return Number.isInteger(id) && id > 0 ? String(id) : String(process.env.DEMO_USER_ID || 1); }
  private ok<T>(data: T) { return { code: 0, message: 'ok', data }; }
}
