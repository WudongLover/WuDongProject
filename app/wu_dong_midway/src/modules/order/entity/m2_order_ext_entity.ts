/**
 * 【order 模块】食（餐饮预订）订单扩展（wudong_m2_order_ext）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 规范 8.3：订单中心在同一事务内写入 t_mX_order_ext，故表虽属 m2，写入方是本模块。
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('wudong_m2_order_ext')
@Index('uk_order', ['orderId'], { unique: true })
@Index('idx_restaurant_date', ['restaurantId', 'diningDate'])
export class M2OrderExtEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId: string;

  @Column({ name: 'restaurant_id', type: 'bigint', unsigned: true })
  restaurantId: string;

  @Column({ name: 'slot_id', type: 'bigint', unsigned: true })
  slotId: string;

  /** 到店日期 */
  @Column({ name: 'dining_date', type: 'date' })
  diningDate: string;

  /** 时段名快照 */
  @Column({ name: 'dining_time', type: 'varchar', length: 64, default: '' })
  diningTime: string;

  /** 用餐人数 */
  @Column({ type: 'int', unsigned: true, default: 1 })
  guests: number;

  @Column({ name: 'contact_name', type: 'varchar', length: 64, default: '' })
  contactName: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 11, default: '' })
  contactPhone: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
