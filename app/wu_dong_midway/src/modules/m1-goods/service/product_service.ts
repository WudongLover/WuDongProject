/**
 * 【m1-goods 模块】商品（wudong_m1_product，衣/特产统一表）
 * service 层：业务逻辑（跨模块只经对方 Service）
 */
import { Inject, Provide } from '@midwayjs/core';
import { ProductPageQueryDTO } from '../dto/product.dto';
import { PageData } from '../dto/result';
import { ProductEntity } from '../entity/product_entity';
import { ProductMapper } from '../mapper/product_mapper';

@Provide()
export class ProductService {
  @Inject()
  productMapper: ProductMapper;

  /** 分页查询商品列表 */
  async page(query: ProductPageQueryDTO): Promise<PageData<ProductEntity>> {
    const { items, total } = await this.productMapper.page({
      page: query.page,
      pageSize: query.page_size,
      module: query.module,
      categoryId: query.category_id,
      keyword: query.keyword,
      status: query.status,
    });
    return {
      items,
      page: query.page,
      page_size: query.page_size,
      total,
    };
  }

  /**
   * 查询商品详情
   * @returns 不存在或已逻辑删除时返回 null
   */
  async detail(id: string): Promise<ProductEntity | null> {
    // 主键为 BIGINT，非数字入参直接判定不存在，避免 MySQL 隐式类型转换
    if (!/^\d+$/.test(id)) return null;
    return this.productMapper.findById(id);
  }
}
