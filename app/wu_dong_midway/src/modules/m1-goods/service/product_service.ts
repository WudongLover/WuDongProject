/**
 * 【m1-goods 模块】商品（wudong_m1_product，衣/特产统一表）
 * service 层：业务逻辑（跨模块只经对方 Service）
 */
import { Inject, Provide } from '@midwayjs/core';
import { ProductCreateDTO, ProductPageQueryDTO } from '../dto/product.dto';
import { CategoryVO, ProductVO, ReviewVO, SkuVO } from '../dto/product_vo';
import { PageData } from '../dto/result';
import { ProductEntity, ProductModule } from '../entity/product_entity';
import { ReviewEntity } from '../entity/review_entity';
import { SkuEntity } from '../entity/sku_entity';
import { CategoryMapper } from '../mapper/category_mapper';
import { ProductMapper } from '../mapper/product_mapper';
import { ReviewMapper } from '../mapper/review_mapper';
import { SkuMapper } from '../mapper/sku_mapper';

/**
 * 商家 ID 占位值
 * TODO: 鉴权接入后改为从登录上下文取当前商家（get_current_merchant），并校验资源归属
 */
const MOCK_MERCHANT_ID = '1';

/** DATETIME → YYYY-MM-DD，对齐前端 Review.date */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toSkuVO(sku: SkuEntity): SkuVO {
  return {
    id: sku.id,
    name: sku.name,
    price: sku.price,
    stock: sku.stock,
  };
}

function toReviewVO(review: ReviewEntity): ReviewVO {
  return {
    id: review.id,
    user: review.userName,
    avatar: review.userAvatar,
    rating: review.rating,
    content: review.content,
    date: toDateString(review.createdAt),
    ...(review.reply ? { reply: review.reply } : {}),
    ...(review.images ? { images: review.images } : {}),
  };
}

@Provide()
export class ProductService {
  @Inject()
  productMapper: ProductMapper;

  @Inject()
  skuMapper: SkuMapper;

  @Inject()
  categoryMapper: CategoryMapper;

  @Inject()
  reviewMapper: ReviewMapper;

  /**
   * 分页查询商品列表
   * SQL 次数固定为 3（商品 + 类目 + SKU 批量），不随商品数增长
   */
  async page(query: ProductPageQueryDTO): Promise<PageData<ProductVO>> {
    const { items, total } = await this.productMapper.page({
      page: query.page,
      pageSize: query.page_size,
      module: query.module,
      categoryId: query.category_id,
      keyword: query.keyword,
      status: query.status,
      sort: query.sort,
      maxPrice: query.max_price,
    });

    const [categoryNames, skuGroups] = await Promise.all([
      this.categoryMapper.findIdNameMap(),
      this.skuMapper.findByProductIds(items.map(item => item.id)),
    ]);

    return {
      items: items.map(item =>
        this.toProductVO(
          item,
          categoryNames.get(item.categoryId) ?? '',
          skuGroups.get(item.id) ?? [],
          // 列表不下发评价，理由见 dto/product_vo.ts 的 reviews 注释
          []
        )
      ),
      page: query.page,
      page_size: query.page_size,
      total,
    };
  }

  /**
   * 查询商品详情（含 SKU 与已过审评价）
   * @returns 不存在或已逻辑删除时返回 null
   */
  async detail(id: string): Promise<ProductVO | null> {
    // 主键为 BIGINT，非数字入参直接判定不存在，避免 MySQL 隐式类型转换
    if (!/^\d+$/.test(id)) return null;

    const product = await this.productMapper.findById(id);
    if (!product) return null;

    const [categoryNames, skus, reviews] = await Promise.all([
      this.categoryMapper.findIdNameMap(),
      this.skuMapper.findByProductId(product.id),
      // 评价表是多态表，target_type 即商品所属模块（GOODS / SPECIALTY）
      this.reviewMapper.findPassedByTarget(product.module, product.id),
    ]);

    return this.toProductVO(
      product,
      categoryNames.get(product.categoryId) ?? '',
      skus,
      reviews
    );
  }

  /** 查询类目列表（前端筛选器把类目名换成 id 传参） */
  async categories(module?: ProductModule): Promise<CategoryVO[]> {
    const rows = await this.categoryMapper.findAll(module);
    return rows.map(row => ({
      id: row.id,
      module: row.module,
      name: row.name,
    }));
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

  /**
   * entity → VO：可空列转成前端要的形态
   * 前端 Product 里 images / detail 是必填，故 NULL 兜底为 [] / ''；
   * craft / artisan / origin / shelfLife 是可选，NULL 时直接不下发该键
   */
  private toProductVO(
    product: ProductEntity,
    categoryName: string,
    skus: SkuEntity[],
    reviews: ReviewEntity[]
  ): ProductVO {
    return {
      id: product.id,
      module: product.module,
      title: product.title,
      subtitle: product.subtitle,
      category: categoryName,
      price: product.price,
      ...(product.marketPrice !== null
        ? { marketPrice: product.marketPrice }
        : {}),
      sales: product.sales,
      rating: product.rating,
      stock: product.stock,
      cover: product.cover,
      images: product.images ?? [],
      skus: skus.map(toSkuVO),
      ...(product.craft ? { craft: product.craft } : {}),
      ...(product.artisan ? { artisan: product.artisan } : {}),
      ...(product.origin ? { origin: product.origin } : {}),
      ...(product.shelfLife ? { shelfLife: product.shelfLife } : {}),
      detail: product.detail ?? '',
      reviews: reviews.map(toReviewVO),
    };
  }
}
