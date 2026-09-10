import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

/**
 * m3住宿模块-房态日历
 *
 * 不继承 base/entity 的 BaseEntity：父类已用 @Index() 装饰 createTime/updateTime，
 * 子类再次声明同名属性会让 TypeORM 生成两组同名索引，同步时报 ER_DUP_KEYNAME。
 * 列名与 scripts/sql/wudong_schema.sql 的 wudong_m3_room_calendar 保持一致。
 */
@Entity('wudong_m3_room_calendar')
@Unique('uk_room_date', ['roomTypeId', 'date'])
export class M3RoomCalendarEntity {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    unsigned: true,
    comment: 'ID',
  })
  id: number;

  @Index('idx_room_type')
  @Column({
    name: 'room_type_id',
    type: 'bigint',
    unsigned: true,
    comment: '房型ID',
  })
  roomTypeId: number;

  @Column({ comment: '日期', type: 'date' })
  date: string;

  @Column({ comment: '当日剩余可售间数', type: 'int', unsigned: true, default: 0 })
  stock: number;

  @Column({
    name: 'price_delta',
    comment: '当日加价（周末节假日）',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  priceDelta: number;

  @Column({ comment: '当日是否停售', type: 'tinyint', default: 0 })
  closed: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createTime: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updateTime: Date;
}
