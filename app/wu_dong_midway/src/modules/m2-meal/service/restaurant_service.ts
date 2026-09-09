import { Inject, Provide } from '@midwayjs/core';
import { FindOptionsWhere, Like } from 'typeorm';
import { RestaurantEntity } from '../entity/restaurant_entity';
import { RestaurantMapper } from '../mapper/restaurant_mapper';

/**
 * 【m2-meal 模块】餐厅业务逻辑
 */
@Provide()
export class RestaurantService {
  @Inject()
  mapper: RestaurantMapper;

  /**
   * 分页查询（支持 keyword / status 过滤）
   */
  async page(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Math.min(Number(query.pageSize) || 20, 100);
    const where: FindOptionsWhere<RestaurantEntity> = {};
    if (query.keyword) {
      where.name = Like(`%${query.keyword}%`);
    }
    if (query.status) {
      where.status = query.status;
    }
    const { list, total } = await this.mapper.page(page, pageSize, where);
    return { list, total, page, pageSize };
  }

  /**
   * 单点查询
   */
  async info(id: number) {
    const entity = await this.mapper.findById(id);
    if (!entity) {
      throw new Error('餐厅不存在');
    }
    return entity;
  }

  /**
   * 新增（merchantId 鉴权接入前 mock 0）
   */
  async add(body: any) {
    const entity = new RestaurantEntity();
    entity.name = body.name;
    entity.cover = body.cover;
    if (body.images !== undefined) entity.images = body.images;
    if (body.pricePerCapita !== undefined)
      entity.pricePerCapita = body.pricePerCapita;
    if (body.address !== undefined) entity.address = body.address;
    if (body.hours !== undefined) entity.hours = body.hours;
    if (body.capacity !== undefined) entity.capacity = body.capacity;
    if (body.tags !== undefined) entity.tags = body.tags;
    if (body.intro !== undefined) entity.intro = body.intro;
    entity.status = body.status || 'ENABLED';
    entity.merchantId = 0;
    return this.mapper.save(entity);
  }

  /**
   * 逻辑删除
   */
  async delete(id: number) {
    const result = await this.mapper.softDelete(id);
    return { affected: result.affected };
  }
}