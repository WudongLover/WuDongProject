import { CoolController, BaseController } from '@cool-midway/core';
import { M3HomestayEntity } from '../../entity/homestay';
import { M3HomestayService } from '../../service/homestay';

/**
 * m3住宿模块-民宿管理接口
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: M3HomestayEntity,
  service: M3HomestayService,
  // 分页查询配置
  pageQueryOp: {
    // 关键词模糊查询字段
    keyWordLikeFields: ['a.name', 'a.address'],
    // 等值查询字段（支持下拉筛选）
    fieldEq: ['a.status', 'a.merchantId'],
    // 模糊查询字段
    fieldLike: ['a.name', 'a.address'],
    // 排序
    addOrderBy: {
      id: 'DESC',
    },
  },
})
export class AdminM3HomestayController extends BaseController {}
