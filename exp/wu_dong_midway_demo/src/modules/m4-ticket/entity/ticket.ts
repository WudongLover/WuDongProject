import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 门票（表 wudong_m4_ticket，m4 行模块骨架示例实体）
 */
@Entity('wudong_m4_ticket')
export class TicketEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  /** 所属景区 wudong_m4_scenic.id */
  @Column({ type: 'bigint', unsigned: true })
  scenic_id: number;

  /** 票名（成人票/联票） */
  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  stock: number;

  /** 购票须知 */
  @Column({ type: 'varchar', length: 255, default: '' })
  note: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'datetime' })
  deleted_at: Date;
}
