/**
 * 【order 模块】支付单（wudong_common_payment）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 规范 8.2 pay：当前为 mock 支付凭证，接入真实渠道时只改 provider / credential。
 *
 * 注：本表的 callback_payload 曾被 cool-admin 的 synchronize 误删过一次
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
import { decimalNotNullTransformer } from './transformers';

@Entity('wudong_common_payment')
@Index('uk_pay_no', ['payNo'], { unique: true })
@Index('idx_order_no', ['orderNo'])
@Index('idx_status', ['status'])
export class PaymentEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'pay_no', type: 'varchar', length: 32 })
  payNo: string;

  @Column({ name: 'order_no', type: 'varchar', length: 32 })
  orderNo: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  /** 支付金额（回调时强校验） */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalNotNullTransformer,
  })
  amount: number;

  /** PENDING / SUCCESS / FAILED / REFUNDED */
  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status: string;

  /** mock / wechat */
  @Column({ type: 'varchar', length: 16, default: 'mock' })
  provider: string;

  /** mock 支付凭证 */
  @Column({ type: 'varchar', length: 500, default: '' })
  credential: string;

  /** 回调原文（幂等校验） */
  @Column({ name: 'callback_payload', type: 'json', nullable: true })
  callbackPayload: Record<string, unknown> | null;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
