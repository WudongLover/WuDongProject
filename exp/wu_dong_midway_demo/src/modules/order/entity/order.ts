import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 订单主表（表 wudong_common_order）
 * 与 scripts/sql/wudong_schema.sql 1.9 节保持一致
 * 各模块预订扩展信息在 wudong_mX_order_ext
 */
@Entity('wudong_common_order')
export class OrderEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  /** 业务单号 WDyymmddNNNN */
  @Column({ type: 'varchar', length: 32 })
  order_no: string;

  /** 来自购物车结算时有值 */
  @Column({ type: 'bigint', unsigned: true, nullable: true })
  checkout_id: number;

  @Column({ type: 'bigint', unsigned: true })
  user_id: number;

  @Column({ type: 'bigint', unsigned: true, default: 0 })
  merchant_id: number;

  /** GOODS / SPECIALTY / MEAL / LODGING / TICKET / ROUTE */
  @Column({ type: 'varchar', length: 16 })
  type: string;

  /** UNPAID / PAID / CONFIRMED / IN_PROGRESS / COMPLETED / CANCELLED / REFUNDED */
  @Column({ type: 'varchar', length: 16, default: 'UNPAID' })
  status: string;

  /** 展示快照标题 */
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  cover: string;

  /** 规格/房型/场次/日期摘要 */
  @Column({ type: 'varchar', length: 500, default: '' })
  summary: string;

  /** 实付金额 */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: string;

  @Column({ type: 'int', unsigned: true, default: 1 })
  qty: number;

  /** 店铺名快照 */
  @Column({ type: 'varchar', length: 128, default: '' })
  shop_name: string;

  /** 支付截止时间 */
  @Column({ type: 'datetime', nullable: true })
  expire_at: Date;

  @Column({ type: 'datetime', nullable: true })
  paid_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date;

  @Column({ type: 'datetime', nullable: true })
  cancelled_at: Date;

  @Column({ type: 'varchar', length: 255, default: '' })
  cancel_reason: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  refund_reason: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refund_amount: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'datetime' })
  deleted_at: Date;
}
