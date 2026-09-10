/**
 * 【m1-goods 模块】商品（wudong_m1_product，衣/特产统一表）
 * mapper 层：数据访问（封装 Repository / SQL，Service 只依赖本文件）
 */
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  IsNull,
  LessThanOrEqual,
  Like,
  Repository,
} from 'typeorm';
import { ProductSort } from '../dto/product.dto';
import {
  ProductEntity,
  ProductModule,
  ProductStatus,
} from '../entity/product_entity';

/** 分页查询条件（已由 DTO 校验与兜底，此处只做拼装） */
export interface ProductPageCondition {
  page: number;
  pageSize: number;
  module?: ProductModule;
  categoryId?: string;
  keyword?: string;
  status?: ProductStatus;
  sort?: ProductSort;
  maxPrice?: number;
}

/** 排序方式 → ORDER BY，default 与未传排序都走最新优先 */
const SORT_ORDER: Record<ProductSort, FindOptionsOrder<ProductEntity>> = {
  default: { createdAt: 'DESC', id: 'DESC' },
  sales: { sales: 'DESC', id: 'DESC' },
  'price-asc': { price: 'ASC', id: 'DESC' },
  'price-desc': { price: 'DESC', id: 'DESC' },
  rating: { rating: 'DESC', id: 'DESC' },
};

@Provide()
export class ProductMapper {
  @InjectEntityModel(ProductEntity)
  productModel: Repository<ProductEntity>;

  /**
   * 分页查询商品
   * deleted_at 由 @DeleteDateColumn 自动过滤，无需手写条件
   */
  async page(
    condition: ProductPageCondition
  ): Promise<{ items: ProductEntity[]; total: number }> {
    const where: FindOptionsWhere<ProductEntity> = {};
    if (condition.module) where.module = condition.module;
    if (condition.categoryId) where.categoryId = condition.categoryId;
    if (condition.status) where.status = condition.status;
    if (condition.keyword) where.title = Like(`%${condition.keyword}%`);
    if (condition.maxPrice !== undefined) {
      where.price = LessThanOrEqual(condition.maxPrice);
    }

    const [items, total] = await this.productModel.findAndCount({
      where,
      order: SORT_ORDER[condition.sort ?? 'default'],
      skip: (condition.page - 1) * condition.pageSize,
      take: condition.pageSize,
    });
    return { items, total };
  }

  /** 按主键查询单个商品，不存在（或已逻辑删除）返回 null */
  async findById(id: string): Promise<ProductEntity | null> {
    return this.productModel.findOneBy({ id });
  }

  /** 新增商品，返回落库后的完整实体 */
  async insert(data: Partial<ProductEntity>): Promise<ProductEntity> {
    const entity = this.productModel.create(data);
    return this.productModel.save(entity);
  }

  /**
   * 逻辑删除：写入 deleted_at，不物理删行
   * 显式限定 deleted_at IS NULL，避免重复删除已删记录时误报成功
   * @returns 是否命中记录（false 表示不存在或已删除）
   */
  async softDeleteById(id: string): Promise<boolean> {
    const result = await this.productModel.softDelete({
      id,
      deletedAt: IsNull(),
    });
    return result.affected > 0;
  }
}
