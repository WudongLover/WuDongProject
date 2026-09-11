import { Controller, Get, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ApiError } from '../../m5-community/error/api_error';
import { UserService } from '../service/user_service';

@Controller('/api/user')
export class UserController {
  @Inject()
  ctx: Context;

  @Inject()
  userService: UserService;

  @Get('/stats')
  async stats() {
    return {
      code: 0,
      message: 'ok',
      data: await this.userService.getStats(this.userId()),
    };
  }

  private userId(): string {
    const id = String((this.ctx as any).userId ?? '');
    if (!/^\d+$/.test(id)) {
      throw new ApiError(1001, '未登录', 401);
    }
    return id;
  }
}
