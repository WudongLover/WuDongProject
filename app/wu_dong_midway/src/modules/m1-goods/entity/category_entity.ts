/**
 * 【m1-goods 模块】商品类目（wudong_m1_category）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 前端 Product.category 是类目「名称」而非 id，故商品 VO 组装时需经本表翻译
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductModule } from './product_entity';

@Entity('wudong_m1_category')
export class CategoryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** 所属业务模块：GOODS 衣 / SPECIALTY 特产 */
  @Column({ type: 'varchar', length: 16 })
  module: ProductModule;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  /** 展示排序，越小越靠前 */
  @Column({ type: 'int', unsigned: true, default: 0 })
  sort: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
