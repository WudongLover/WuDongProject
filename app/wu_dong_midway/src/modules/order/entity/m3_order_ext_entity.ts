/**
 * 【order 模块】住（民宿预订）订单扩展（wudong_m3_order_ext）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 规范 8.3：订单中心在同一事务内写入 t_mX_order_ext，故表虽属 m3，写入方是本模块。
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('wudong_m3_order_ext')
@Index('uk_order', ['orderId'], { unique: true })
@Index('idx_room_dates', ['roomTypeId', 'checkInDate', 'checkOutDate'])
export class M3OrderExtEntity {
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
