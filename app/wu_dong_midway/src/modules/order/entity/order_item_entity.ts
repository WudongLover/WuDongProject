/**
 * 【order 模块】订单明细（wudong_common_order_item）
 * entity 层：购物车下单后逐项记录商品明细（仅实物类 GOODS / SPECIALTY）。
 *
 * 约定同 order_entity：synchronize 关闭、列名 snake_case、DECIMAL 转 number、
 * BIGINT 主键/外键以 string 返回。
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string) => Number(value),
};

@Entity('wudong_common_order_item')
export class OrderItemEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId: string;

  /** 明细仅实物类：GOODS / SPECIALTY */
  @Column({ name: 'target_type', type: 'varchar', length: 16 })
  targetType: string;

  /** m1_product.id */
  @Column({ name: 'target_id', type: 'bigint', unsigned: true })
  targetId: string;

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
    transformer: decimalTransformer,
  })
  price: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  qty: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  amount: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
