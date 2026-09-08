import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 餐厅（表 wudong_m2_restaurant，m2 食模块骨架示例实体）
 */
@Entity('wudong_m2_restaurant')
export class RestaurantEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, default: 0 })
  merchant_id: number;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  cover: string;

  /** 详情图集 */
  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 5.0 })
  rating: string;

  /** 人均 */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price_per_capita: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  address: string;

  /** 营业时间 */
  @Column({ type: 'varchar', length: 128, default: '' })
  hours: string;

  /** 总容量 */
  @Column({ type: 'int', unsigned: true, default: 0 })
  capacity: number;

  /** 标签数组 */
  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 2000, nullable: true })
  intro: string;

  /** ENABLED / DISABLED */
  @Column({ type: 'varchar', length: 16, default: 'ENABLED' })
  status: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'datetime' })
  deleted_at: Date;
}
