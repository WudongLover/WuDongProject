/**
 * 【m4-ticket 模块】行订单扩展（wudong_m4_order_ext）
 * 一行对应一笔 TICKET / ROUTE 订单的预订参数（门票或路线二选一）。
 *
 * id 与各外键沿用本模块既有实体的 string 类型（mysql2 BIGINT 以 string 返回）。
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('wudong_m4_order_ext')
export class TicketOrderExtEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId: string;

  /** 门票订单填（m4_scenic.id） */
  @Column({ name: 'scenic_id', type: 'bigint', unsigned: true, nullable: true })
  scenicId: string | null;

  /** 门票订单填（m4_ticket.id） */
  @Column({ name: 'ticket_id', type: 'bigint', unsigned: true, nullable: true })
  ticketId: string | null;

  /** 路线订单填（m4_route.id） */
  @Column({ name: 'route_id', type: 'bigint', unsigned: true, nullable: true })
  routeId: string | null;

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
