/**
 * 【m1-goods 模块】购物车 C 端接口
 * 鉴权：auth_middleware 对 /api/cart 全方法校验 Bearer token，注入 ctx.userId；
 * 身份只认 token，不再接受 X-User-Id 头或 DEMO_USER_ID 兜底。
 */
import { Body, Controller, Del, Get, Inject, Param, Post, Put } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ApiError } from '../../m5-community/error/api_error';
import { AddCartPayload, CartService } from '../service/cart_service';

@Controller('/api/cart')
export class CartController {
  @Inject()
  ctx: Context;

  @Inject()
  cartService: CartService;

  /** 购物车列表 */
  @Get('/')
  async list() {
    return this.ok(await this.cartService.list(this.userId()));
  }

  /** 加入购物车：同 SKU 合并数量，返回最新列表 */
  @Post('/')
  async add(@Body() body: AddCartPayload) {
    return this.ok(await this.cartService.add(this.userId(), body ?? ({} as AddCartPayload)));
  }

  /** 更新数量 / 勾选状态 */
  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() body: { qty?: number; checked?: boolean }
  ) {
    return this.ok(await this.cartService.update(this.userId(), id, body ?? {}));
  }

  /** 删除（软删除）购物车项 */
  @Del('/:id')
  async remove(@Param('id') id: string) {
    return this.ok(await this.cartService.remove(this.userId(), id));
  }

  /** 结算前校验库存与在售状态 */
  @Post('/check')
  async check() {
    return this.ok(await this.cartService.check(this.userId()));
  }

  private userId(): string {
    const id = String((this.ctx as any).userId ?? '');
    if (!/^\d+$/.test(id) || Number(id) <= 0) {
      throw new ApiError(1001, '未登录', 401);
    }
    return id;
  }

  private ok<T>(data: T) {
    return { code: 0, message: 'ok', data };
  }
}
