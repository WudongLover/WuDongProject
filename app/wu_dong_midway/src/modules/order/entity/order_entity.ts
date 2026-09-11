/**
 * 【order 模块】订单主表（wudong_common_order）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 约定：
 * - 表结构以 scripts/sql/wudong_schema.sql 为准，synchronize 关闭，本文件不得反向改表
 * - 属性 camelCase，列名经 name 映射到 snake_case
 * - BIGINT 主键/外键以 string 返回（与 user/m1/m3 既有实体一致）
 * - DECIMAL 经 transformer 转 number，对齐前端 Order.amount
 * - deleted_at 走 @DeleteDateColumn，查询自动过滤
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

const decimalTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

/** 订单类型：GOODS / SPECIALTY / MEAL / LODGING / TICKET / ROUTE */
export type OrderType =
  | 'GOODS'
  | 'SPECIALTY'
  | 'MEAL'
  | 'LODGING'
  | 'TICKET'
  | 'ROUTE';

/** 订单状态：UNPAID / PAID / CONFIRMED / IN_PROGRESS / COMPLETED / CANCELLED / REFUNDED */
export type OrderStatus =
  | 'UNPAID'
  | 'PAID'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

@Entity('wudong_common_order')
export class OrderEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_no', type: 'varchar', length: 32 })
  orderNo: string;

  @Column({ name: 'checkout_id', type: 'bigint', nullable: true })
  checkoutId: string | null;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @Column({ name: 'merchant_id', type: 'bigint', unsigned: true, default: 0 })
  merchantId: string;

  @Column({ type: 'varchar', length: 16 })
  type: OrderType;

  @Column({ type: 'varchar', length: 16, default: 'UNPAID' })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  cover: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  summary: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  qty: number;

  @Column({ name: 'shop_name', type: 'varchar', length: 128, default: '' })
  shopName: string;

  @Column({ name: 'expire_at', type: 'datetime', nullable: true })
  expireAt: Date | null;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancel_reason', type: 'varchar', length: 255, default: '' })
  cancelReason: string;

  @Column({ name: 'refund_reason', type: 'varchar', length: 255, default: '' })
  refundReason: string;

  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  refundAmount: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}