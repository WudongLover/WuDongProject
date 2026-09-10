import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wudong_m4_route')
export class M4RouteEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Index('idx_merchant')
  @Column({ name: 'merchant_id', type: 'bigint', unsigned: true, default: 0 })
  merchantId: number;

  @Column({ type: 'varchar', length: 128 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  cover: string;

  @Column({ type: 'int', unsigned: true, default: 1 })
  days: number;

  @Index('idx_theme')
  @Column({ type: 'varchar', length: 64, default: '' })
  theme: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  sales: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 5 })
  rating: string;

  @Column({ type: 'varchar', length: 128, default: '' })
  departure: string;

  @Column({ type: 'json', nullable: true })
  includes: string[] | null;

  @Column({ type: 'json', nullable: true })
  notice: string[] | null;

  @Column({ type: 'varchar', length: 16, default: 'ON_SHELF' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
