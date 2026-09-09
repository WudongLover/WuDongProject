import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ProductEntity } from '../entity/product_entity';

/**
 * 【m1-goods 模块】商品数据访问层：封装 Repository，Service 只依赖本文件
 */
@Provide()
export class ProductMapper {
  @InjectEntityModel(ProductEntity)
  repo: Repository<ProductEntity>;

  /**
   * 分页查询（findAndCount 自动排除已逻辑删除记录）
   */
  async page(
    page: number,
    pageSize: number,
    where: FindOptionsWhere<ProductEntity>
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
  async save(entity: ProductEntity) {
    return this.repo.save(entity);
  }

  /**
   * 逻辑删除（置 deleted_at，不物理删除）
   */
  async softDelete(id: number) {
    return this.repo.softDelete(id);
  }
}