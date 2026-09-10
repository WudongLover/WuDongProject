import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
@Entity('wudong_m4_ticket')
export class TicketEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: string;
  @Column({ name: 'scenic_id', type: 'bigint', unsigned: true }) scenicId: string;
  @Column({ length: 128 }) name: string; @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 }) price: number;
  @Column({ type: 'int', unsigned: true, default: 0 }) stock: number; @Column({ length: 255, default: '' }) note: string;
  @CreateDateColumn({ name: 'created_at', type: 'datetime' }) createdAt: Date; @UpdateDateColumn({ name: 'updated_at', type: 'datetime' }) updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true }) deletedAt: Date | null;
}
