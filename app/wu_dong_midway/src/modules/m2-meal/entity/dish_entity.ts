/**
 * 【m2-meal 模块】菜品（wudong_m2_dish）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 约定同 restaurant_entity：synchronize 关闭、列名 snake_case、DECIMAL 转 number；
 * is_signature 为 TINYINT(1)，entity 存 0/1（聚合 VO 时转 boolean，对齐前端 Dish.signature）。
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

const decimalTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity('wudong_m2_dish')
export class DishEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'restaurant_id', type: 'bigint', unsigned: true })
  restaurantId!: number;

  @Column({ type: 'varchar', length: 128 })
  name!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  price!: number;

  @Column({ type: 'varchar', length: 500, default: '' })
  img!: string;

  @Column({ name: 'is_signature', type: 'tinyint', width: 1, default: 0 })
  isSignature!: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  sort!: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt!: Date;
}