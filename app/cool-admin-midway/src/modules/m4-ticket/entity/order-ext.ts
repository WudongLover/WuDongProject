import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('wudong_m4_order_ext')
export class M4OrderExtEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true, unique: true })
  orderId: number;

  @Column({ name: 'scenic_id', type: 'bigint', unsigned: true, nullable: true })
  scenicId: number | null;

  @Column({ name: 'ticket_id', type: 'bigint', unsigned: true, nullable: true })
  ticketId: number | null;

  @Column({ name: 'route_id', type: 'bigint', unsigned: true, nullable: true })
  routeId: number | null;

  @Column({ name: 'travel_date', type: 'date' })
  travelDate: string;

  @Column({ type: 'int', unsigned: true, default: 1 })
  guests: number;

  @Column({ name: 'contact_name', length: 64, default: '' })
  contactName: string;

  @Column({ name: 'contact_phone', length: 11, default: '' })
  contactPhone: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
