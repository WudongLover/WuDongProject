import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wudong_common_order')
export class CommonOrderEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'order_no', length: 32, unique: true })
  orderNo: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @Column({ name: 'merchant_id', type: 'bigint', unsigned: true, default: 0 })
  merchantId: number;

  @Column({ length: 16 })
  type: string;

  @Column({ length: 16, default: 'UNPAID' })
  status: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 500, default: '' })
  cover: string;

  @Column({ length: 500, default: '' })
  summary: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: string;

  @Column({ type: 'int', unsigned: true, default: 1 })
  qty: number;

  @Column({ name: 'shop_name', length: 128, default: '' })
  shopName: string;

  @Column({ name: 'expire_at', type: 'datetime', nullable: true })
  expireAt: Date | null;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancel_reason', length: 255, default: '' })
  cancelReason: string;

  @Column({ name: 'refund_reason', length: 255, default: '' })
  refundReason: string;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
