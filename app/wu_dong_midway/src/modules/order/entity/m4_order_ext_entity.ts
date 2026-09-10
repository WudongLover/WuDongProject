/**
 * 【order 模块】行（门票/路线）订单扩展（wudong_m4_order_ext）
 * entity 层：表字段映射（列对齐 wudong 库）
 *
 * 规范 8.3：订单中心在同一事务内写入 t_mX_order_ext，故表虽属 m4，写入方是本模块。
 * TICKET 填 scenic_id + ticket_id，ROUTE 填 route_id，二者互斥。
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('wudong_m4_order_ext')
@Index('uk_order', ['orderId'], { unique: true })
@Index('idx_travel_date', ['travelDate'])
export class M4OrderExtEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId: string;

  /** 门票订单填 */
  @Column({ name: 'scenic_id', type: 'bigint', unsigned: true, nullable: true })
  scenicId: string | null;

  @Column({ name: 'ticket_id', type: 'bigint', unsigned: true, nullable: true })
  ticketId: string | null;

  /** 路线订单填 */
  @Column({ name: 'route_id', type: 'bigint', unsigned: true, nullable: true })
  routeId: string | null;

  /** 出游日期 */
  @Column({ name: 'travel_date', type: 'date' })
  travelDate: string;

  @Column({ type: 'int', unsigned: true, default: 1 })
  guests: number;

  @Column({ name: 'contact_name', type: 'varchar', length: 64, default: '' })
  contactName: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 11, default: '' })
  contactPhone: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
