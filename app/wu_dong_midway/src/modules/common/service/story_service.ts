/**
 * 【common 模块】文化推文（wudong_common_story）
 * service 层：业务逻辑 + VO 组装（VO 结构对齐前端 types.ts：CultureStory）
 * 推文由管理端编写，C 端接口只暴露 PUBLISHED 内容
 */
import { Inject, Provide } from '@midwayjs/core';
import { StoryMapper } from '../mapper/story_mapper';
import { StoryEntity, StoryLink, StoryModule } from '../entity/story_entity';
// 公共业务错误类现放 m5-community（前端契约对齐），common 复用不重复定义
import { ApiError } from '../../m5-community/error/api_error';

/** CultureStory（前端 types.ts）：id 即 slug，quote/links 为空时不下发 */
export interface StoryVo {
  id: string;
  module: StoryModule;
  eyebrow: string;
  title: string;
  summary: string;
  paragraphs: string[];
  cover: string;
  quote?: string;
  links?: StoryLink[];
}

/** 合法模块值；非法入参一律视为不过滤 */
const MODULES: StoryModule[] = ['YI', 'SHI', 'ZHU', 'XING'];

@Provide()
export class StoryService {
  @Inject()
  storyMapper: StoryMapper;

  /** 已发布推文列表，module 合法时按模块过滤，模块内按 sort 升序 */
  async list(module?: string): Promise<StoryVo[]> {
    const mod = MODULES.includes(module as StoryModule) ? (module as StoryModule) : undefined;
    const rows = await this.storyMapper.findPublished(mod);
    return rows.map((row) => this.toVo(row));
  }

  /** 按 slug 取单条已发布推文，不存在返回 404（前端 ApiError code 1003） */
  async detailBySlug(slug: string): Promise<StoryVo> {
    const row = await this.storyMapper.findPublishedBySlug(slug);
    if (!row) {
      throw new ApiError(1003, '推文不存在', 404);
    }
    return this.toVo(row);
  }

  /** 实体 → 前端 CultureStory：quote 空串与 links 空数组统一省略 */
  private toVo(row: StoryEntity): StoryVo {
    return {
      id: row.slug,
      module: row.module,
      eyebrow: row.eyebrow,
      title: row.title,
      summary: row.summary,
      paragraphs: Array.isArray(row.paragraphs) ? row.paragraphs : [],
      cover: row.cover,
      quote: row.quote || undefined,
      links: row.links?.length ? row.links : undefined,
    };
  }
}
