/**
 * 【order 模块】订单领域事件（wudong_common_order_event）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 规范 8.3：事务内落库 + 异步投递，消费者按 event 幂等。
 * 本模块只负责「落库投递」，消费与重试任务（1/5/30 分钟递增、超 5 次入死信）是独立 P1 条目。
 *
 * 注：本表的 retry_count / next_retry_at 曾被 cool-admin 的 synchronize 误删过一次
 * （见 config.local.ts 的 synchronize 注释），已按 wudong_schema.sql 恢复。
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wudong_common_order_event')
@Index('idx_order_no', ['orderNo'])
@Index('idx_status_retry', ['status', 'nextRetryAt'])
export class OrderEventEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_no', type: 'varchar', length: 32 })
  orderNo: string;

  /** ORDER_CREATED / ORDER_PAID / ORDER_CANCELLED / REFUND_APPROVED */
  @Column({ name: 'event_type', type: 'varchar', length: 32 })
  eventType: string;

  /** 消费方模块：m1 / m2 / m3 / m4 */
  @Column({ name: 'target_module', type: 'varchar', length: 8 })
  targetModule: string;

  /** PENDING / SUCCESS / DEAD(死信) */
  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status: string;

  /** 1/5/30 分钟递增重试，超 5 次入死信 */
  @Column({ name: 'retry_count', type: 'int', unsigned: true, default: 0 })
  retryCount: number;

  @Column({ name: 'next_retry_at', type: 'datetime', nullable: true })
  nextRetryAt: Date | null;

  @Column({ type: 'json', nullable: true })
  payload: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
