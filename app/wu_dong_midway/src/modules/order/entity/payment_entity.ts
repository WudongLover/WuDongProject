/**
 * 【order 模块】支付单（wudong_common_payment）
 * entity 层：mock 支付凭证。不接真实支付 API，pay 接口成功后落一条 SUCCESS 记录。
 *
 * 约定同 order_entity：synchronize 关闭、列名 snake_case、DECIMAL 转 number。
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

const decimalTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

/** 支付状态：PENDING / SUCCESS / FAILED / REFUNDED */
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

@Entity('wudong_common_payment')
export class PaymentEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'pay_no', type: 'varchar', length: 32 })
  payNo: string;

  @Column({ name: 'order_no', type: 'varchar', length: 32 })
  orderNo: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 16, default: 'mock' })
  provider: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  credential: string;

  @Column({ name: 'callback_payload', type: 'json', nullable: true })
  callbackPayload: any;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}