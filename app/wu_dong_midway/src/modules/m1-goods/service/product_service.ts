/**
 * 【m1-goods 模块】商品（wudong_m1_product，衣/特产统一表）
 * service 层：业务逻辑（跨模块只经对方 Service）
 */
import { Inject, Provide } from '@midwayjs/core';
import { ProductCreateDTO, ProductPageQueryDTO } from '../dto/product.dto';
import { PageData } from '../dto/result';
import { ProductEntity } from '../entity/product_entity';
import { ProductMapper } from '../mapper/product_mapper';

/**
 * 商家 ID 占位值
 * TODO: 鉴权接入后改为从登录上下文取当前商家（get_current_merchant），并校验资源归属
 */
const MOCK_MERCHANT_ID = '1';

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

  /** 新增商品（sales / rating 用表默认值，不由入参决定） */
  async create(body: ProductCreateDTO): Promise<ProductEntity> {
    return this.productMapper.insert({
      module: body.module,
      categoryId: body.category_id,
      merchantId: MOCK_MERCHANT_ID,
      title: body.title,
      subtitle: body.subtitle,
      price: body.price,
      marketPrice: body.market_price ?? null,
      stock: body.stock,
      cover: body.cover,
      images: body.images ?? null,
      detail: body.detail ?? null,
      craft: body.craft ?? null,
      artisan: body.artisan ?? null,
      origin: body.origin ?? null,
      shelfLife: body.shelf_life ?? null,
      status: body.status,
    });
  }

  /**
   * 逻辑删除商品
   * @returns false 表示不存在或已删除
   */
  async remove(id: string): Promise<boolean> {
    if (!/^\d+$/.test(id)) return false;
    return this.productMapper.softDeleteById(id);
  }
}
