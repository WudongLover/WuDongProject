/**
 * 【m1-goods 模块】商品类目（wudong_m1_category）
 * mapper 层：数据访问（封装 Repository / SQL，Service 只依赖本文件）
 */
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CategoryEntity } from '../entity/category_entity';
import { ProductModule } from '../entity/product_entity';

@Provide()
export class CategoryMapper {
  @InjectEntityModel(CategoryEntity)
  categoryModel: Repository<CategoryEntity>;

  /**
   * 查询类目列表
   * @param module 不传则返回全部模块的类目
   */
  async findAll(module?: ProductModule): Promise<CategoryEntity[]> {
    const where: FindOptionsWhere<CategoryEntity> = {};
    if (module) where.module = module;

    return this.categoryModel.find({
      where,
      order: { module: 'ASC', sort: 'ASC', id: 'ASC' },
    });
  }

  /**
   * 全部类目的 id → 名称映射（商品 VO 把 category_id 翻译成前端要的名称）
   * 类目是低频变更的小表（个位数量级），一次全量查询即可
   */
  async findIdNameMap(): Promise<Map<string, string>> {
    const rows = await this.categoryModel.find();
    return new Map(rows.map(row => [row.id, row.name]));
  }
}
