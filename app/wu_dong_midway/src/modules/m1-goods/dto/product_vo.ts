/**
 * 【m1-goods 模块】商品响应 VO
 *
 * 字段风格：响应实体用 camelCase，逐字段对齐前端 wu_dong_vue/src/types.ts 的 Product。
 * 与 entity 的差异：
 * - category 是类目「名称」（entity 存 categoryId），经 category_mapper 翻译
 * - skus / reviews 是关联查询后组装的数组，entity 里没有对应列
 * - 不下发 merchantId / categoryId / createdAt 等前端用不到的内部字段
 *
 * 改动本文件时需同步前端 types.ts，两端字段必须一致。
 */
import { Artisan, ProductModule } from '../entity/product_entity';

/** 规格，对齐前端 Sku */
export interface SkuVO {
  id: string;
  name: string;
  price: number;
  stock: number;
}

/** 评价，对齐前端 Review */
export interface ReviewVO {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  content: string;
  /** YYYY-MM-DD，由 created_at 格式化 */
  date: string;
  reply?: string;
  images?: string[];
}

/** 商品，对齐前端 Product */
export interface ProductVO {
  id: string;
  module: ProductModule;
  title: string;
  subtitle: string;
  /** 类目名称（如「银饰」），类目缺失时为空串 */
  category: string;
  price: number;
  marketPrice?: number;
  sales: number;
  rating: number;
  stock: number;
  cover: string;
  images: string[];
  skus: SkuVO[];
  /** 非遗工艺介绍（衣） */
  craft?: string;
  artisan?: Artisan;
  /** 农产品溯源（特产） */
  origin?: string;
  shelfLife?: string;
  detail: string;
  /**
   * 评价列表。
   * 注意：列表接口固定返回空数组（评价数量无上界，不为列表页批量拉取），
   * 仅详情接口填充真实数据。
   */
  reviews: ReviewVO[];
}

/** 类目，供前端筛选器把名称映射回 id */
export interface CategoryVO {
  id: string;
  module: ProductModule;
  name: string;
}
