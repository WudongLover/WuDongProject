/**
 * 【order 模块】订单主表（wudong_common_order）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 约定：
 * - 表结构以 scripts/sql/wudong_schema.sql 为准，synchronize 关闭，本文件不得反向改表
 * - 各模块预订/履约参数不放本表，写 wudong_mX_order_ext；本表只存列表展示快照
 * - DECIMAL 列经 transformer 转 number
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalNotNullTransformer, decimalTransformer } from './transformers';

@Entity('wudong_common_order')
// 索引声明与 wudong_schema.sql 的 DDL 逐条对齐；synchronize 关闭时不产生 DDL，
// 但将来用 migration:generate 生成迁移时，声明错会写出多余的索引变更。
@Index('uk_order_no', ['orderNo'], { unique: true })
@Index('idx_user_status', ['userId', 'status'])
@Index('idx_user_type', ['userId', 'type'])
@Index('idx_merchant', ['merchantId'])
@Index('idx_status', ['status'])
export class OrderEntity {
  /** BIGINT 主键，TypeORM 以 string 返回 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  /** 业务单号 WDyymmddNNNN */
  @Column({ name: 'order_no', type: 'varchar', length: 32 })
  orderNo: string;

  /** 来自购物车结算时有值 */
  @Column({ name: 'checkout_id', type: 'bigint', unsigned: true, nullable: true })
  checkoutId: string | null;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @Column({ name: 'merchant_id', type: 'bigint', unsigned: true, default: 0 })
  merchantId: string;

  /** GOODS / SPECIALTY / MEAL / LODGING / TICKET / ROUTE */
  @Column({ type: 'varchar', length: 16 })
  type: string;

  /** UNPAID / PAID / CONFIRMED / IN_PROGRESS / COMPLETED / CANCELLED / REFUNDED */
  @Column({ type: 'varchar', length: 16, default: 'UNPAID' })
  status: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  cover: string;

  /** 规格/房型/场次/日期摘要 */
  @Column({ type: 'varchar', length: 500, default: '' })
  summary: string;

  /** 实付金额 */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalNotNullTransformer,
  })
  amount: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  qty: number;

  /** 店铺名快照（前端 Order.shop） */
  @Column({ name: 'shop_name', type: 'varchar', length: 128, default: '' })
  shopName: string;

  /** 支付截止，超时任务自动取消 */
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

  /** 未退款时为 null */
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
