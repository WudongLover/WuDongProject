import { Body, Controller, Get, Inject, Put } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { FavoriteService } from '../service/favorite_service';
import { ApiError } from '../error/api_error';

const VALID_TARGET_TYPES = ['GOODS', 'SPECIALTY', 'RESTAURANT', 'HOMESTAY', 'ROUTE', 'POST'];

@Controller('/api/favorites')
export class FavoriteController {
  @Inject()
  ctx: Context;

  @Inject()
  favoriteService: FavoriteService;

  /** 反转收藏状态（已收→取消，未收→收藏） */
  @Put('/')
  async toggle(@Body() body: { targetType?: string; targetId?: number }) {
    const userId = Number((this.ctx as any).userId);
    if (!userId) throw new ApiError(1001, '未登录', 401);

    if (!body.targetType || !VALID_TARGET_TYPES.includes(body.targetType)) {
      throw new ApiError(1004, 'targetType 无效', 400);
    }
    const targetId = Number(body.targetId);
    if (!Number.isFinite(targetId) || targetId <= 0) {
      throw new ApiError(1004, 'targetId 无效', 400);
    }

    return {
      code: 0,
      message: 'ok',
      data: await this.favoriteService.toggle(userId, { targetType: body.targetType, targetId }),
    };
  }

  /** 当前用户全部收藏（聚合各模块名/封面） */
  @Get('/')
  async list() {
    const userId = Number((this.ctx as any).userId);
    if (!userId) throw new ApiError(1001, '未登录', 401);

    return {
      code: 0,
      message: 'ok',
      data: await this.favoriteService.list(userId),
    };
  }
}