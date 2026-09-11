import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wudong_m1_order_ext')
export class M1OrderExtEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId: string;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true })
  productId: string;

  @Column({ name: 'sku_id', type: 'bigint', unsigned: true, default: 0 })
  skuId: string;

  @Column({ name: 'receiver_name', type: 'varchar', length: 64, default: '' })
  receiverName: string;

  @Column({ name: 'receiver_phone', type: 'varchar', length: 11, default: '' })
  receiverPhone: string;

  @Column({ name: 'receiver_addr', type: 'varchar', length: 255, default: '' })
  receiverAddr: string;

  @Column({ name: 'logistics_no', type: 'varchar', length: 64, default: '' })
  logisticsNo: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
