import { CoolController, BaseController } from '@cool-midway/core';
import { M3RoomTypeEntity } from '../../entity/room-type';
import { M3HomestayService } from '../../service/homestay';

/**
 * m3住宿模块-房型管理接口
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: M3RoomTypeEntity,
  service: M3HomestayService,
  // 分页查询配置
  pageQueryOp: {
    // 关键词模糊查询字段
    keyWordLikeFields: ['a.name'],
    // 等值查询字段（支持下拉筛选）
    fieldEq: ['a.homestayId'],
    // 排序
    addOrderBy: {
      id: 'DESC',
    },
  },
})
export class AdminM3RoomTypeController extends BaseController {}
