/**
 * 【common 模块】文化推文（wudong_common_story）
 * mapper 层：数据访问（封装 Repository / SQL），Service 只依赖本文件
 * C 端只读 PUBLISHED 且未删除的数据；管理端 CRUD 后续在此追加方法
 */
import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, FindOptionsWhere, IsNull } from 'typeorm';
import { StoryEntity, StoryStatus } from '../entity/story_entity';

@Provide()
export class StoryMapper {
  @InjectDataSource('default')
  dataSource: DataSource;

  /** 已发布推文列表：可选 module 精确过滤，模块内按 sort 升序（同 sort 按 id） */
  findPublished(module?: string): Promise<StoryEntity[]> {
    const where: FindOptionsWhere<StoryEntity> = {
      status: 'PUBLISHED' as StoryStatus,
      deletedAt: IsNull(),
    };
    if (module) {
      where.module = module as StoryEntity['module'];
    }
    return this.dataSource.getRepository(StoryEntity).find({
      where,
      order: { sort: 'ASC', id: 'ASC' },
    });
  }

  /** 按 slug 取单条已发布推文（详情页路由 id 即 slug） */
  findPublishedBySlug(slug: string): Promise<StoryEntity | null> {
    return this.dataSource.getRepository(StoryEntity).findOne({
      where: { slug, status: 'PUBLISHED' as StoryStatus, deletedAt: IsNull() },
    });
  }
}
