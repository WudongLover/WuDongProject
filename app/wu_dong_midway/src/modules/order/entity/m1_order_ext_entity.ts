/**
 * 【order 模块】衣/特产订单扩展（wudong_m1_order_ext）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 规范 8.3：订单中心在同一事务内写入 t_mX_order_ext，故表虽属 m1，写入方是本模块。
 * uk_order 一对一：购物车合并下单时本表只能承载一件商品，多商品明细写 wudong_common_order_item。
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('wudong_m1_order_ext')
@Index('uk_order', ['orderId'], { unique: true })
export class M1OrderExtEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId: string;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true })
  productId: string;

  /** m1_sku.id，无 SKU 时为 0 */
  @Column({ name: 'sku_id', type: 'bigint', unsigned: true, default: 0 })
  skuId: string;

  /** 收货人快照（当前 payload 无收货地址，留空待地址模块接入） */
  @Column({ name: 'receiver_name', type: 'varchar', length: 64, default: '' })
  receiverName: string;

  @Column({ name: 'receiver_phone', type: 'varchar', length: 11, default: '' })
  receiverPhone: string;

  /** 收货地址快照（下单时固化） */
  @Column({ name: 'receiver_addr', type: 'varchar', length: 255, default: '' })
  receiverAddr: string;

  /** 发货物流单号 */
  @Column({ name: 'logistics_no', type: 'varchar', length: 64, default: '' })
  logisticsNo: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
