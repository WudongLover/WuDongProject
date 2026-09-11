import { CoolController, BaseController } from '@cool-midway/core';
import { StoryEntity } from '../../entity/story';
import { StoryService } from '../../service/story';

/**
 * 文化推文管理接口（管理端编写维护，C 端接口只读已发布）
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: StoryEntity,
  service: StoryService,
  // 分页查询配置
  pageQueryOp: {
    // 关键词模糊查询字段
    keyWordLikeFields: ['a.title', 'a.slug', 'a.summary'],
    // 等值查询字段（模块、状态下拉筛选）
    fieldEq: ['a.module', 'a.status'],
    // 默认排序：按模块分组，模块内按 sort 升序
    addOrderBy: {
      module: 'ASC',
      sort: 'ASC',
    },
  },
})
export class AdminStoryController extends BaseController {}
