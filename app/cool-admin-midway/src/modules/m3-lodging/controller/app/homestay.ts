import { BaseController, CoolTag, CoolUrlTag, TagTypes } from '@cool-midway/core';
import { Controller, Get, Inject, Param, Provide } from '@midwayjs/core';
import { M3HomestayService } from '../../service/homestay';
import { M3RoomTypeEntity } from '../../entity/room-type';
import { M3RoomCalendarEntity } from '../../entity/room-calendar';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';

/** C端民宿接口 */
@Controller('/app/m3/homestay')
@CoolUrlTag()
@Provide()
export class AppM3HomestayController extends BaseController {
  @Inject()
  homestayService: M3HomestayService;

  @InjectEntityModel(M3RoomTypeEntity)
  roomTypeEntity: Repository<M3RoomTypeEntity>;

  @InjectEntityModel(M3RoomCalendarEntity)
  roomCalendarEntity: Repository<M3RoomCalendarEntity>;

  /** 获取民宿列表（仅返回已上架，含房型） */
  @Get('/', { summary: '获取民宿列表' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async list() {
    const list = await this.homestayService.homestayEntity.find({
      where: { status: 'ENABLED' },
      order: { id: 'DESC' },
    });

    // 为每个民宿加载房型
    const result = await Promise.all(
      list.map(async (h) => {
        const rooms = await this.roomTypeEntity.find({
          where: { homestayId: h.id },
          order: { id: 'ASC' },
        });
        return { ...h, rooms };
      })
    );

    return this.ok(result);
  }

  /** 获取民宿详情（含房型） */
  @Get('/detail/:id', { summary: '获取民宿详情' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async detail(@Param('id') id: number) {
    const info = await this.homestayService.homestayEntity.findOneBy({ id });
    if (!info) {
      return this.fail('民宿不存在');
    }

    // 加载房型
    const rooms = await this.roomTypeEntity.find({
      where: { homestayId: id },
      order: { id: 'ASC' },
    });

    return this.ok({ ...info, rooms, reviews: [] });
  }

  /** 获取房态日历 */
  @Get('/room-calendar/:roomTypeId', { summary: '获取房态日历' })
  @CoolTag(TagTypes.IGNORE_TOKEN)
  async roomCalendar(@Param('roomTypeId') roomTypeId: number) {
    const calendar = await this.roomCalendarEntity.find({
      where: { roomTypeId },
      order: { date: 'ASC' },
    });
    return this.ok(calendar);
  }
}
