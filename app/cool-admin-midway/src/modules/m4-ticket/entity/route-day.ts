import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('wudong_m4_route_day')
@Index('uk_route_day', ['routeId', 'day'], { unique: true })
export class M4RouteDayEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'route_id', type: 'bigint', unsigned: true })
  routeId: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  day: number;

  @Column({ length: 128 })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 128, default: '' })
  meals: string;

  @Column({ length: 128, default: '' })
  stay: string;
}
