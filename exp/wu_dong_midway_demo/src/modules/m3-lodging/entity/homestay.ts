import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 民宿（表 wudong_m3_homestay，m3 住模块骨架示例实体）
 */
@Entity('wudong_m3_homestay')
export class HomestayEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, default: 0 })
  merchant_id: number;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  cover: string;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 5.0 })
  rating: string;

  /** {"hygiene":4.9,"location":4.8,"service":5.0} */
  @Column({ type: 'json', nullable: true })
  score: any;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  /** 设施列表 */
  @Column({ type: 'json', nullable: true })
  facilities: string[];

  @Column({ type: 'varchar', length: 255, default: '' })
  address: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  intro: string;

  /** 入住须知 */
  @Column({ type: 'text', nullable: true })
  notice: string;

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
