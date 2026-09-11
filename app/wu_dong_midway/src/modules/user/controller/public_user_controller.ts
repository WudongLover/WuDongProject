import { Controller, Get, Inject, Param, Put } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { PostService } from '../../m5-community/service/post_service';
import { ApiError } from '../../m5-community/error/api_error';
import { FollowService } from '../service/follow_service';
import { UserService } from '../service/user_service';

@Controller('/api/users')
export class PublicUserController {
  @Inject()
  ctx: Context;

  @Inject()
  userService: UserService;

  @Inject()
  followService: FollowService;

  @Inject()
  postService: PostService;

  @Get('/:id')
  async profile(@Param('id') id: string) {
    return this.ok(await this.userService.getPublicProfile(id, this.optionalUserId()));
  }

  @Get('/:id/posts')
  async posts(@Param('id') id: string) {
    return this.ok(await this.postService.listByAuthor(this.ctx, Number(id)));
  }

  @Get('/:id/following')
  async following(@Param('id') id: string) {
    return this.ok(await this.followService.listFollowing(id));
  }

  @Get('/:id/followers')
  async followers(@Param('id') id: string) {
    return this.ok(await this.followService.listFollowers(id));
  }

  @Put('/:id/follow')
  async follow(@Param('id') id: string) {
    return this.ok(await this.followService.toggle(this.userId(), id));
  }

  private optionalUserId(): string | undefined {
    const id = String((this.ctx as any).userId ?? '');
    return /^\d+$/.test(id) ? id : undefined;
  }

  private userId(): string {
    const id = this.optionalUserId();
    if (!id) throw new ApiError(1001, '未登录', 401);
    return id;
  }

  private ok<T>(data: T) {
    return { code: 0, message: 'ok', data };
  }
}
