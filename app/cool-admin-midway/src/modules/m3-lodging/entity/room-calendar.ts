import { BaseEntity, transformerTime } from '../../base/entity/base';
import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * m3住宿模块-房态日历
 */
@Entity('wudong_m3_room_calendar')
@Unique('uk_room_date', ['roomTypeId', 'date'])
export class M3RoomCalendarEntity extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { comment: 'ID' })
  id: number;

  @Index()
  @Column({ name: 'created_at', comment: '创建时间', type: 'varchar', transformer: transformerTime })
  createTime: Date;

  @Index()
  @Column({ name: 'updated_at', comment: '更新时间', type: 'varchar', transformer: transformerTime })
  updateTime: Date;

  @Index()
  @Column({ name: 'room_type_id', comment: '房型ID' })
  roomTypeId: number;

  @Column({ comment: '日期', type: 'date' })
  date: string;

  @Column({ comment: '当日剩余可售间数', default: 0 })
  stock: number;

  @Column({
    comment: '当日加价（周末节假日）',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  priceDelta: number;

  @Column({ comment: '当日是否停售', default: 0 })
  closed: number;
}
