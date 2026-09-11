/**
 * 【m2-meal 模块】餐饮预订订单扩展（wudong_m2_order_ext）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 一行对应一笔 MEAL 订单的预订参数（餐厅/时段/到店日期/人数/联系人）。
 * order_id 关联 wudong_common_order.id（string），与 OrderEntity 主键类型一致；
 * restaurant_id / slot_id 跟随本模块既有实体声明为 number。
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('wudong_m2_order_ext')
export class MealOrderExtEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId!: string;

  @Column({ name: 'restaurant_id', type: 'bigint', unsigned: true })
  restaurantId!: number;

  @Column({ name: 'slot_id', type: 'bigint', unsigned: true })
  slotId!: number;

  @Column({ name: 'dining_date', type: 'date' })
  diningDate!: string;

  @Column({ name: 'dining_time', type: 'varchar', length: 64, default: '' })
  diningTime!: string;

  @Column({ type: 'int', unsigned: true, default: 1 })
  guests!: number;

  @Column({ name: 'contact_name', type: 'varchar', length: 64, default: '' })
  contactName!: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 11, default: '' })
  contactPhone!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;
}