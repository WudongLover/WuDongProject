/**
 * 【m2-meal 模块】预订时段模板（wudong_m2_time_slot）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 约定同 restaurant_entity：synchronize 关闭、列名 snake_case；
 * 本模块实体 id 沿用 number（与 RestaurantEntity 一致）。
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wudong_m2_time_slot')
export class TimeSlotEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'restaurant_id', type: 'bigint', unsigned: true })
  restaurantId!: number;

  @Column({ type: 'varchar', length: 64 })
  name!: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  capacity!: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  sort!: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}