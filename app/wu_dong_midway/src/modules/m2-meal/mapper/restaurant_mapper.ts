import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { RestaurantEntity } from '../entity/restaurant_entity';

/**
 * 【m2-meal 模块】餐厅数据访问层：封装 Repository，Service 只依赖本文件
 */
@Provide()
export class RestaurantMapper {
  @InjectEntityModel(RestaurantEntity)
  repo!: Repository<RestaurantEntity>;

  /**
   * 分页查询（findAndCount 自动排除已逻辑删除记录）
   */
  async page(
    page: number,
    pageSize: number,
    where: FindOptionsWhere<RestaurantEntity>
  ) {
    const [list, total] = await this.repo.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total };
  }

  /**
   * 单点查询（自动排除已逻辑删除记录）
   */
  async findById(id: number) {
    return this.repo.findOneBy({ id });
  }

  /**
   * 新增
   */
  async save(entity: RestaurantEntity) {
    return this.repo.save(entity);
  }

  /**
   * 逻辑删除（置 deleted_at，不物理删除）
   */
  async softDelete(id: number) {
    return this.repo.softDelete(id);
  }
}