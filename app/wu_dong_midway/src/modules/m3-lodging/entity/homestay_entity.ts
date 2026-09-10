import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
const decimalTransformer = { to: (v: number) => v, from: (v: string | null) => (v === null ? null : Number(v)) };
@Entity('wudong_m3_homestay')
export class HomestayEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: string;
  @Column({ name: 'merchant_id', type: 'bigint', default: 0 }) merchantId: string;
  @Column({ length: 128 }) name: string; @Column({ length: 500 }) cover: string;
  @Column({ type: 'json', nullable: true }) images: string[] | null;
  @Column({ type: 'decimal', precision: 2, scale: 1, default: 5, transformer: decimalTransformer }) rating: number;
  @Column({ type: 'json', nullable: true }) score: Record<string, number> | null;
  @Column({ type: 'json', nullable: true }) tags: string[] | null;
  @Column({ type: 'json', nullable: true }) facilities: string[] | null;
  @Column({ length: 255, default: '' }) address: string; @Column({ type: 'text', nullable: true }) intro: string | null;
  @Column({ type: 'text', nullable: true }) notice: string | null; @Column({ length: 16, default: 'ENABLED' }) status: string;
  @CreateDateColumn({ name: 'created_at', type: 'datetime' }) createdAt: Date; @UpdateDateColumn({ name: 'updated_at', type: 'datetime' }) updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true }) deletedAt: Date | null;
}
