import { Provide } from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { StoryEntity } from '../entity/story';

/**
 * 文化推文服务：增删改查由 CoolController 的 api 声明驱动，这里补充业务校验
 */
@Provide()
export class StoryService extends BaseService {
  @InjectEntityModel(StoryEntity)
  storyEntity: Repository<StoryEntity>;

  /**
   * 新增|修改前：slug 唯一（C 端按 slug 取详情，重复会导致详情串内容）；
   * 状态改为 PUBLISHED 且未填发布时间时，自动补当前时间
   */
  async modifyBefore(data: any, type: 'add' | 'update' | 'delete') {
    if (type === 'delete') return;
    const rows = Array.isArray(data) ? data : [data];
    for (const row of rows) {
      if (row.slug) {
        const exist = await this.storyEntity.findOne({
          where: { slug: row.slug },
          withDeleted: true,
        });
        if (exist && String(exist.id) !== String(row.id)) {
          throw new CoolCommException(`slug「${row.slug}」已存在，请换一个`);
        }
      }
      if (row.status === 'PUBLISHED' && !row.publishedAt) {
        row.publishedAt = new Date();
      }
    }
  }
}
