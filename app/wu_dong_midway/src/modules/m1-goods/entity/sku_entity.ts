/**
 * 【m1-goods 模块】商品 SKU（wudong_m1_sku）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 约定同 product_entity：synchronize 关闭，本文件不得反向改表；
 * DECIMAL 经 transformer 转 number，对齐前端 types.ts 的 Sku.price
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** DECIMAL → number */
const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string) => Number(value),
};

@Entity('wudong_m1_sku')
export class SkuEntity {
  /** BIGINT 主键，TypeORM 以 string 返回，与前端 Sku.id: string 一致 */
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'product_id', type: 'bigint' })
  productId: string;

  /** 规格名（如 中号 · 圈口 58mm） */
  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  price: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  stock: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
