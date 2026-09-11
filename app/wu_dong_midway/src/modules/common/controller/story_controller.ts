/**
 * 【common 模块】文化推文（wudong_common_story）
 * controller 层：接口与路由，统一响应 { code, message, data }（对齐前端契约）
 * C 端只读接口；管理端维护接口后续单独提供
 */
import { Controller, Get, Inject, Param, Query } from '@midwayjs/core';
import { StoryService } from '../service/story_service';

@Controller('/api/v1/common')
export class StoryController {
  @Inject()
  storyService: StoryService;

  private ok<T>(data: T) {
    return { code: 0, message: 'ok', data };
  }

  /** 推文列表：可选 ?module=YI|SHI|ZHU|XING，仅返回 PUBLISHED，模块内按 sort 升序 */
  @Get('/stories')
  async list(@Query('module') module?: string) {
    return this.ok(await this.storyService.list(module));
  }

  /** 推文详情：按 slug（前端 /culture/:id 路由参数） */
  @Get('/stories/:slug')
  async detail(@Param('slug') slug: string) {
    return this.ok(await this.storyService.detailBySlug(slug));
  }
}
