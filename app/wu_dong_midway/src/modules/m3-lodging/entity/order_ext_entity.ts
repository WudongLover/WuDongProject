/**
 * 【m3-lodging 模块】民宿预订订单扩展（wudong_m3_order_ext）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 一行对应一笔 LODGING 订单的预订参数（民宿/房型/入住离店日期/晚数/人数/联系人）。
 * id 与各外键沿用本模块既有实体的 string 类型（mysql2 BIGINT 以 string 返回）。
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('wudong_m3_order_ext')
export class LodgingOrderExtEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId: string;

  @Column({ name: 'homestay_id', type: 'bigint', unsigned: true })
  homestayId: string;

  @Column({ name: 'room_type_id', type: 'bigint', unsigned: true })
  roomTypeId: string;

  @Column({ name: 'check_in_date', type: 'date' })
  checkInDate: string;

  @Column({ name: 'check_out_date', type: 'date' })
  checkOutDate: string;

  @Column({ type: 'int', unsigned: true, default: 1 })
  nights: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  guests: number;

  @Column({ name: 'contact_name', type: 'varchar', length: 64, default: '' })
  contactName: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 11, default: '' })
  contactPhone: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}