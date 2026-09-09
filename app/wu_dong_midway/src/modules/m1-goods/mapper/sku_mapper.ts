/**
 * 【m1-goods 模块】商品 SKU（wudong_m1_sku）
 * mapper 层：数据访问（封装 Repository / SQL，Service 只依赖本文件）
 */
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { In, Repository } from 'typeorm';
import { SkuEntity } from '../entity/sku_entity';

@Provide()
export class SkuMapper {
  @InjectEntityModel(SkuEntity)
  skuModel: Repository<SkuEntity>;

  /** 查询单个商品的全部 SKU（deleted_at 由 @DeleteDateColumn 自动过滤） */
  async findByProductId(productId: string): Promise<SkuEntity[]> {
    return this.skuModel.find({
      where: { productId },
      order: { id: 'ASC' },
    });
  }

  /**
   * 批量查询多个商品的 SKU（列表页用，一次 IN 查询避免 N+1）
   * @returns key 为 productId 的分组结果
   */
  async findByProductIds(
    productIds: string[]
  ): Promise<Map<string, SkuEntity[]>> {
    const grouped = new Map<string, SkuEntity[]>();
    if (productIds.length === 0) return grouped;

    const rows = await this.skuModel.find({
      where: { productId: In(productIds) },
      order: { id: 'ASC' },
    });
    for (const row of rows) {
      const list = grouped.get(row.productId);
      if (list) list.push(row);
      else grouped.set(row.productId, [row]);
    }
    return grouped;
  }
}
