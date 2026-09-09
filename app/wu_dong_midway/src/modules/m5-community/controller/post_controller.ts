/**
 * 【m5-community 模块】帖子（wudong_m5_post）
 * controller 层：接口与路由，统一响应 { code, message, data }（对齐前端契约）
 */
import { Body, Controller, Get, Inject, Param, Post, Put, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { PostService, PublishBody, CommentBody } from '../service/post_service';

@Controller('/api')
export class PostController {
  @Inject()
  ctx: Context;

  @Inject()
  postService: PostService;

  private ok<T>(data: T) {
    return { code: 0, message: 'ok', data };
  }

  /** 帖子列表：可选 ?topic=（带 # 前缀精确匹配）、?sort=hot|new */
  @Get('/posts')
  async list(@Query('topic') topic?: string, @Query('sort') sort?: string) {
    return this.ok(await this.postService.list(this.ctx, topic, sort));
  }

  /** 帖子详情：包含评论/楼中楼，阅读数 +1 */
  @Get('/posts/:id')
  async detail(@Param('id') id: string) {
    return this.ok(await this.postService.detail(this.ctx, this.toId(id)));
  }

  /** 发布游记 */
  @Post('/posts')
  async create(@Body() body: PublishBody) {
    return this.ok(await this.postService.create(this.ctx, (body ?? {}) as PublishBody));
  }

  /** 点赞切换（再点取消）：PUT 表示幂等操作 */
  @Put('/posts/:id/like')
  async like(@Param('id') id: string) {
    return this.ok(await this.postService.toggleLike(this.ctx, this.toId(id)));
  }

  /** 获取帖子评论列表（不含详情页的楼中楼，可按需扩展） */
  @Get('/posts/:id/comments')
  async listComments(@Param('id') id: string) {
    return this.ok(await this.postService.listComments(this.ctx, this.toId(id)));
  }

  /** 新增评论（body.content 必填，body.parentId 可选），返回该帖完整评论数组 */
  @Post('/posts/:id/comments')
  async comment(@Param('id') id: string, @Body() body: CommentBody) {
    return this.ok(await this.postService.addComment(this.ctx, this.toId(id), (body ?? {}) as CommentBody));
  }

  /** 路径参数 → 正整数 id，非法一律视为不存在 */
  private toId(id: string): number {
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : -1;
  }
}
