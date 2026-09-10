/**
 * 【m1-goods 模块】商品接口 DTO
 *
 * 字段风格约定（技术开发规范 7.1 与前端 types.ts 的折中）：
 * - 请求参数用 snake_case（page_size / category_id / market_price）
 * - 响应实体用 camelCase，对齐前端 types.ts 的 Product
 */
import { Rule, RuleType } from '@midwayjs/validate';
import { Artisan, ProductModule, ProductStatus } from '../entity/product_entity';

/** 列表排序方式，取值与前端 GoodsListView 的 sorts 一致 */
export type ProductSort =
  | 'default'
  | 'sales'
  | 'price-asc'
  | 'price-desc'
  | 'rating';

/** 分页查询入参 */
export class ProductPageQueryDTO {
  @Rule(RuleType.number().integer().min(1).default(1))
  page: number;

  @Rule(RuleType.number().integer().min(1).max(100).default(20))
  page_size: number;

  /** 业务模块：GOODS 衣 / SPECIALTY 特产；不传则两者都查 */
  @Rule(RuleType.string().valid('GOODS', 'SPECIALTY'))
  module?: ProductModule;

  @Rule(RuleType.string().pattern(/^\d+$/))
  category_id?: string;

  /** 标题模糊搜索 */
  @Rule(RuleType.string().trim().max(64))
  keyword?: string;

  @Rule(RuleType.string().valid('ON_SHELF', 'OFF_SHELF'))
  status?: ProductStatus;

  /** 排序：不传按默认（最新优先） */
  @Rule(
    RuleType.string().valid(
      'default',
      'sales',
      'price-asc',
      'price-desc',
      'rating'
    )
  )
  sort?: ProductSort;

  /** 价格上限（含），对应前端筛选栏的「价格上限」 */
  @Rule(RuleType.number().min(0))
  max_price?: number;
}

/** 新增商品入参（sales / rating 由系统维护，不接受传入） */
export class ProductCreateDTO {
  @Rule(RuleType.string().valid('GOODS', 'SPECIALTY').required())
  module: ProductModule;

  @Rule(RuleType.string().pattern(/^\d+$/).required())
  category_id: string;

  @Rule(RuleType.string().trim().min(1).max(128).required())
  title: string;

  @Rule(RuleType.string().trim().max(255).allow('').default(''))
  subtitle: string;

  @Rule(RuleType.number().min(0).required())
  price: number;

  @Rule(RuleType.number().min(0).allow(null))
  market_price?: number | null;

  @Rule(RuleType.number().integer().min(0).default(0))
  stock: number;

  @Rule(RuleType.string().trim().max(500).required())
  cover: string;

  /** 详情轮播图 URL 数组 */
  @Rule(RuleType.array().items(RuleType.string().max(500)))
  images?: string[];

  /** 图文详情（富文本） */
  @Rule(RuleType.string().allow(''))
  detail?: string;

  /** 非遗工艺介绍（衣） */
  @Rule(RuleType.string().max(2000).allow(''))
  craft?: string;

  /** 匠人信息（衣） */
  @Rule(
    RuleType.object({
      name: RuleType.string().required(),
      title: RuleType.string().required(),
      avatar: RuleType.string().required(),
      story: RuleType.string().required(),
    })
  )
  artisan?: Artisan;

  /** 农产品溯源（特产） */
  @Rule(RuleType.string().max(255).allow(''))
  origin?: string;

  /** 保质期（特产） */
  @Rule(RuleType.string().max(64).allow(''))
  shelf_life?: string;

  @Rule(RuleType.string().valid('ON_SHELF', 'OFF_SHELF').default('ON_SHELF'))
  status: ProductStatus;
}
