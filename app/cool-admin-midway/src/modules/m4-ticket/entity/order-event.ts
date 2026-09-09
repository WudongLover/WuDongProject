import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wudong_common_order_event')
export class CommonOrderEventEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'order_no', length: 32 })
  orderNo: string;

  @Column({ name: 'event_type', length: 32 })
  eventType: string;

  @Column({ name: 'target_module', length: 8, default: 'm4' })
  targetModule: string;

  @Column({ length: 16, default: 'PENDING' })
  status: string;

  @Column({ name: 'payload', type: 'json', nullable: true })
  payload: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
