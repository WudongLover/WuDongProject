import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

const decimalTransformer = {
  to: (value: number | string) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity('wudong_common_cart_item')
export class CartItemEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true })
  productId: string;

  @Column({ name: 'sku_id', type: 'bigint', unsigned: true })
  skuId: string;

  @Column({ name: 'merchant_id', type: 'bigint', unsigned: true, default: 0 })
  merchantId: string;

  @Column({ type: 'int', unsigned: true, default: 1 })
  qty: number;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  checked: boolean;

  @Column({ type: 'varchar', length: 255, default: '' })
  title: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  cover: string;

  @Column({ name: 'sku_name', type: 'varchar', length: 128, default: '' })
  skuName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  price: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  stock: number;

  @Column({ name: 'shop_name', type: 'varchar', length: 128, default: '' })
  shopName: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
