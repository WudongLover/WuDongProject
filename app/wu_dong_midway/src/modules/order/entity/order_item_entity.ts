/**
 * 【order 模块】订单明细（wudong_common_order_item）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 仅实物类（GOODS / SPECIALTY）逐项记录，即购物车多商品结算后的拆行。
 * 本表无 updated_at / deleted_at，写入即定稿。
 */
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { decimalNotNullTransformer } from './transformers';

@Entity('wudong_common_order_item')
@Index('idx_order', ['orderId'])
export class OrderItemEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId: string;

  /** GOODS / SPECIALTY（明细仅实物类） */
  @Column({ name: 'target_type', type: 'varchar', length: 16 })
  targetType: string;

  /** m1_product.id */
  @Column({ name: 'target_id', type: 'bigint', unsigned: true })
  targetId: string;

  /** m1_sku.id，无 SKU 时为 0 */
  @Column({ name: 'sku_id', type: 'bigint', unsigned: true, default: 0 })
  skuId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  cover: string;

  @Column({ name: 'sku_name', type: 'varchar', length: 128, default: '' })
  skuName: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalNotNullTransformer,
  })
  price: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  qty: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalNotNullTransformer,
  })
  amount: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
