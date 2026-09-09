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
 * 【m1-goods 模块】商品（wudong_m1_product，衣 GOODS / 食特产 SPECIALTY 统一表）
 * 列名对齐 scripts/sql/wudong_schema.sql，snake_case 显式映射
 */
@Entity('wudong_m1_product')
export class ProductEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, comment: 'ID' })
  id!: number;

  @Column({
    name: 'module',
    type: 'varchar',
    length: 16,
    comment: 'GOODS 衣 / SPECIALTY 食特产',
  })
  module!: string;

  @Column({
    name: 'category_id',
    type: 'bigint',
    unsigned: true,
    comment: '类目ID（分类接入前 mock 0）',
  })
  categoryId!: number;

  @Index()
  @Column({
    name: 'merchant_id',
    type: 'bigint',
    unsigned: true,
    default: 0,
    comment: '商家ID（鉴权接入前 mock 0）',
  })
  merchantId!: number;

  @Column({ name: 'title', type: 'varchar', length: 128, comment: '标题' })
  title!: string;

  @Column({
    name: 'subtitle',
    type: 'varchar',
    length: 255,
    default: '',
    comment: '副标题',
  })
  subtitle!: string;

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: '售价',
  })
  price!: number;

  @Column({
    name: 'market_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: '划线价',
  })
  marketPrice!: number;

  @Column({
    name: 'sales',
    type: 'int',
    unsigned: true,
    default: 0,
    comment: '销量',
  })
  sales!: number;

  @Column({
    name: 'rating',
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 5.0,
    comment: '评分',
  })
  rating!: number;

  @Column({
    name: 'stock',
    type: 'int',
    unsigned: true,
    default: 0,
    comment: '总库存',
  })
  stock!: number;

  @Column({ name: 'cover', type: 'varchar', length: 500, comment: '主图' })
  cover!: string;

  @Column({ name: 'images', type: 'json', nullable: true, comment: '详情轮播图' })
  images: any;

  @Column({ name: 'detail', type: 'text', nullable: true, comment: '图文详情' })
  detail!: string;

  @Column({
    name: 'craft',
    type: 'varchar',
    length: 2000,
    nullable: true,
    comment: '非遗工艺介绍（衣）',
  })
  craft!: string;

  @Column({
    name: 'artisan',
    type: 'json',
    nullable: true,
    comment: '匠人信息（衣）',
  })
  artisan: any;

  @Column({
    name: 'origin',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '农产品溯源（特产）',
  })
  origin!: string;

  @Column({
    name: 'shelf_life',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: '保质期（特产）',
  })
  shelfLife!: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 16,
    default: 'ON_SHELF',
    comment: 'ON_SHELF / OFF_SHELF',
  })
  status!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    comment: '创建时间',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    comment: '更新时间',
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
    comment: '逻辑删除时间',
  })
  deletedAt!: Date;
}