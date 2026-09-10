import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 【m1-goods 模块】商品（wudong_m1_product，衣/特产统一表）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 约定：
 * - 表结构以 scripts/sql/wudong_schema.sql 为准，synchronize 关闭，本文件不得反向改表
 * - 属性用 camelCase 对齐前端 types.ts 的 Product，列名经 name 映射到 snake_case
 * - DECIMAL 列经 transformer 转 number（mysql2 默认返回字符串，前端 price 为 number）
 * - deleted_at 走 @DeleteDateColumn，查询自动过滤，实现逻辑删除
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** 商品所属业务模块：GOODS 衣（非遗商品）/ SPECIALTY 食（特产） */
export type ProductModule = 'GOODS' | 'SPECIALTY';

/** 上下架状态 */
export type ProductStatus = 'ON_SHELF' | 'OFF_SHELF';

/** 匠人信息（artisan JSON 列，衣模块使用） */
export interface Artisan {
  name: string;
  title: string;
  avatar: string;
  story: string;
}

/** DECIMAL → number，NULL 保持 null */
const decimalTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity('wudong_m1_product')
export class ProductEntity {
  /** BIGINT 主键，TypeORM 以 string 返回，与前端 Product.id: string 一致 */
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 16 })
  module: ProductModule;

  @Column({ name: 'category_id', type: 'bigint' })
  categoryId: string;

  /** 商家 ID，鉴权接入前由 service 写入 mock 值 */
  @Column({ name: 'merchant_id', type: 'bigint', default: 0 })
  merchantId: string;

  @Column({ type: 'varchar', length: 128 })
  title: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  subtitle: string;

  /** 售价（展示取 SKU 最低价同步） */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  price: number;

  /** 划线价 */
  @Column({
    name: 'market_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  marketPrice: number | null;

  /** 销量（下单后累加） */
  @Column({ type: 'int', unsigned: true, default: 0 })
  sales: number;

  /** 评分（评价后重算） */
  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 5.0,
    transformer: decimalTransformer,
  })
  rating: number;

  /** 总库存（ΣSKU，冗余） */
  @Column({ type: 'int', unsigned: true, default: 0 })
  stock: number;

  @Column({ type: 'varchar', length: 500 })
  cover: string;

  /** 详情轮播图 URL 数组 */
  @Column({ type: 'json', nullable: true })
  images: string[] | null;

  /** 图文详情（富文本，服务端白名单过滤后落库） */
  @Column({ type: 'text', nullable: true })
  detail: string | null;

  /** 非遗工艺介绍（衣） */
  @Column({ type: 'varchar', length: 2000, nullable: true })
  craft: string | null;

  /** 匠人信息（衣） */
  @Column({ type: 'json', nullable: true })
  artisan: Artisan | null;

  /** 农产品溯源（特产） */
  @Column({ type: 'varchar', length: 255, nullable: true })
  origin: string | null;

  /** 保质期（特产） */
  @Column({ name: 'shelf_life', type: 'varchar', length: 64, nullable: true })
  shelfLife: string | null;

  @Column({ type: 'varchar', length: 16, default: 'ON_SHELF' })
  status: ProductStatus;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  /** 逻辑删除标记：非空即已删除，TypeORM 查询默认过滤 */
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
