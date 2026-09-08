import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Like, Repository } from 'typeorm';
import { HomestayEntity } from '../entity/homestay';

/**
 * m3-lodging 模块：民宿住宿（骨架示例，表 wudong_m3_homestay）
 * 后续扩展：房型 wudong_m3_room_type、房态日历 wudong_m3_room_calendar
 */
@Provide()
export class HomestayService {
  @InjectEntityModel(HomestayEntity)
  homestayModel: Repository<HomestayEntity>;

  async page(query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 10;
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.keyword) {
      where.name = Like(`%${query.keyword}%`);
    }
    const [list, total] = await this.homestayModel.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { list, total, page, size };
  }

  async info(id: number | string) {
    return this.homestayModel.findOne({ where: { id: id as any } });
  }

  async add(body: Partial<HomestayEntity>) {
    return this.homestayModel.save(this.homestayModel.create(body));
  }

  async update(body: any) {
    const { id, ...rest } = body;
    await this.homestayModel.update({ id }, rest);
    return this.info(id);
  }

  async remove(id: number | string) {
    await this.homestayModel.softDelete({ id: id as any });
    return { ok: true };
  }
}
