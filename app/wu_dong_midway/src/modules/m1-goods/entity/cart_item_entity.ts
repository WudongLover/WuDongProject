/**
 * 【m1-goods 模块】购物车（wudong_common_cart_item）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 约定：
 * - 表结构以 scripts/sql/wudong_schema.sql 为准，synchronize 关闭，本文件不得反向改表
 * - DECIMAL 列经 transformer 转 number；checked 为 TINYINT(1)，读侧兼容 0/1
 * - deleted_at 走 @DeleteDateColumn，实现软删除（移除购物车项即写删除时间）
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

/** DECIMAL → number，NULL 保持 null */
const decimalTransformer = {
  to: (value: number | string) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity('wudong_common_cart_item')
export class CartItemEntity {
  /** BIGINT 主键，TypeORM 以 string 返回，与前端 CartItem.id: string 一致 */
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Index('idx_user')
  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true })
  productId: string;

  /** SKU 主键；无 SKU 商品为 0 */
  @Column({ name: 'sku_id', type: 'bigint', unsigned: true, default: 0 })
  skuId: string;

  @Column({ name: 'merchant_id', type: 'bigint', unsigned: true, default: 0 })
  merchantId: string;

  @Column({ type: 'int', unsigned: true, default: 1 })
  qty: number;

  /** 是否勾选结算（TINYINT(1)） */
  @Column({ type: 'tinyint', width: 1, default: 1 })
  checked: boolean;

  /** 商品名快照 */
  @Column({ type: 'varchar', length: 255, default: '' })
  title: string;

  /** 封面快照 */
  @Column({ type: 'varchar', length: 500, default: '' })
  cover: string;

  /** SKU 名快照（Cart.sku） */
  @Column({ name: 'sku_name', type: 'varchar', length: 128, default: '' })
  skuName: string;

  /** 加车时单价快照 */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  price: number;

  /** 下单时可用库存快照 */
  @Column({ type: 'int', unsigned: true, default: 0 })
  stock: number;

  /** 店铺名快照（按店铺拆单） */
  @Column({ name: 'shop_name', type: 'varchar', length: 128, default: '' })
  shopName: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  /** 软删除标记：非空即已移除 */
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
