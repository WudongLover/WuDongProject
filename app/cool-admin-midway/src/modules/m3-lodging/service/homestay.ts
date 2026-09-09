import { M3HomestayEntity } from './../entity/homestay';
import { M3RoomTypeEntity } from './../entity/room-type';
import { M3RoomCalendarEntity } from './../entity/room-calendar';
import { Provide } from '@midwayjs/core';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';

/**
 * m3住宿模块-民宿服务
 */
@Provide()
export class M3HomestayService extends BaseService {
  @InjectEntityModel(M3HomestayEntity)
  homestayEntity: Repository<M3HomestayEntity>;

  @InjectEntityModel(M3RoomTypeEntity)
  roomTypeEntity: Repository<M3RoomTypeEntity>;

  @InjectEntityModel(M3RoomCalendarEntity)
  roomCalendarEntity: Repository<M3RoomCalendarEntity>;

  /**
   * 执行entity分页
   */
  async entityPage(query) {
    const find = this.homestayEntity.createQueryBuilder();
    return this.entityRenderPage(find, query);
  }
}
