import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 商品（衣/特产统一表，表 wudong_m1_product）
 * module=GOODS(衣) | SPECIALTY(食·特产)，m2 特产经本表读写
 */
@Entity('wudong_m1_product')
export class ProductEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  /** GOODS 衣 / SPECIALTY 食特产 */
  @Column({ type: 'varchar', length: 16 })
  module: string;

  @Column({ type: 'bigint', unsigned: true })
  category_id: number;

  @Column({ type: 'bigint', unsigned: true, default: 0 })
  merchant_id: number;

  @Column({ type: 'varchar', length: 128 })
  title: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  subtitle: string;

  /** 售价（展示取 SKU 最低价同步） */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: string;

  /** 划线价 */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  market_price: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  sales: number;

  /** 评分（评价后重算） */
  @Column({ type: 'decimal', precision: 2, scale: 1, default: 5.0 })
  rating: string;

  /** 总库存（ΣSKU，冗余） */
  @Column({ type: 'int', unsigned: true, default: 0 })
  stock: number;

  @Column({ type: 'varchar', length: 500 })
  cover: string;

  /** 详情轮播图 URL 数组 */
  @Column({ type: 'json', nullable: true })
  images: string[];

  /** 图文详情（富文本，服务端白名单过滤） */
  @Column({ type: 'text', nullable: true })
  detail: string;

  /** 非遗工艺介绍（衣） */
  @Column({ type: 'varchar', length: 2000, nullable: true })
  craft: string;

  /** 匠人 {name,title,avatar,story}（衣） */
  @Column({ type: 'json', nullable: true })
  artisan: any;

  /** 农产品溯源（特产） */
  @Column({ type: 'varchar', length: 255, nullable: true })
  origin: string;

  /** 保质期（特产） */
  @Column({ type: 'varchar', length: 64, nullable: true })
  shelf_life: string;

  /** ON_SHELF / OFF_SHELF */
  @Column({ type: 'varchar', length: 16, default: 'ON_SHELF' })
  status: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'datetime' })
  deleted_at: Date;
}
