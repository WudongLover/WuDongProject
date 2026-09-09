import { CoolController, BaseController } from '@cool-midway/core';
import { M3RoomCalendarEntity } from '../../entity/room-calendar';
import { M3HomestayService } from '../../service/homestay';

/**
 * m3住宿模块-房态日历管理接口
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: M3RoomCalendarEntity,
  service: M3HomestayService,
  // 分页查询配置
  pageQueryOp: {
    // 等值查询字段（支持下拉筛选）
    fieldEq: ['a.roomTypeId', 'a.date'],
    // 排序
    addOrderBy: {
      date: 'DESC',
    },
  },
})
export class AdminM3RoomCalendarController extends BaseController {}
