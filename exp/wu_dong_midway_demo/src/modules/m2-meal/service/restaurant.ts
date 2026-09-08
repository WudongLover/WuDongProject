import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Like, Repository } from 'typeorm';
import { RestaurantEntity } from '../entity/restaurant';

/**
 * m2-meal 模块：餐饮（骨架示例，表 wudong_m2_restaurant）
 * 后续扩展：菜品 wudong_m2_dish、时段余量 wudong_m2_time_slot/wudong_m2_slot_quota
 */
@Provide()
export class RestaurantService {
  @InjectEntityModel(RestaurantEntity)
  restaurantModel: Repository<RestaurantEntity>;

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
    const [list, total] = await this.restaurantModel.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { list, total, page, size };
  }

  async info(id: number | string) {
    return this.restaurantModel.findOne({ where: { id: id as any } });
  }

  async add(body: Partial<RestaurantEntity>) {
    return this.restaurantModel.save(this.restaurantModel.create(body));
  }

  async update(body: any) {
    const { id, ...rest } = body;
    await this.restaurantModel.update({ id }, rest);
    return this.info(id);
  }

  async remove(id: number | string) {
    await this.restaurantModel.softDelete({ id: id as any });
    return { ok: true };
  }
}
