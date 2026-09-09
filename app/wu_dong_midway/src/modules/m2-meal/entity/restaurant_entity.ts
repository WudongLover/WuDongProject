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
 * 【m2-meal 模块】餐厅（wudong_m2_restaurant）
 * 列名对齐 scripts/sql/wudong_schema.sql，snake_case 显式映射
 */
@Entity('wudong_m2_restaurant')
export class RestaurantEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, comment: 'ID' })
  id: number;

  @Index()
  @Column({
    name: 'merchant_id',
    type: 'bigint',
    unsigned: true,
    default: 0,
    comment: '商家ID（鉴权接入前 mock 0）',
  })
  merchantId: number;

  @Column({ name: 'name', type: 'varchar', length: 128, comment: '名称' })
  name: string;

  @Column({ name: 'cover', type: 'varchar', length: 500, comment: '主图' })
  cover: string;

  @Column({ name: 'images', type: 'json', nullable: true, comment: '详情图集' })
  images: any;

  @Column({
    name: 'rating',
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 5.0,
    comment: '评分',
  })
  rating: number;

  @Column({
    name: 'price_per_capita',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: '人均',
  })
  pricePerCapita: number;

  @Column({
    name: 'address',
    type: 'varchar',
    length: 255,
    default: '',
    comment: '地址',
  })
  address: string;

  @Column({
    name: 'hours',
    type: 'varchar',
    length: 128,
    default: '',
    comment: '营业时间',
  })
  hours: string;

  @Column({
    name: 'capacity',
    type: 'int',
    unsigned: true,
    default: 0,
    comment: '总容量',
  })
  capacity: number;

  @Column({ name: 'tags', type: 'json', nullable: true, comment: '标签数组' })
  tags: any;

  @Column({
    name: 'intro',
    type: 'varchar',
    length: 2000,
    nullable: true,
    comment: '介绍',
  })
  intro: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 16,
    default: 'ENABLED',
    comment: 'ENABLED / DISABLED',
  })
  status: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    comment: '创建时间',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    comment: '更新时间',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
    comment: '逻辑删除时间',
  })
  deletedAt: Date;
}