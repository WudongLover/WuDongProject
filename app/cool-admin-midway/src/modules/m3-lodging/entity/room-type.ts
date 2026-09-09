import { BaseEntity, transformerTime } from '../../base/entity/base';
import { Column, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * m3住宿模块-房型
 */
@Entity('wudong_m3_room_type')
export class M3RoomTypeEntity extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { comment: 'ID' })
  id: number;

  @Index()
  @Column({ name: 'created_at', comment: '创建时间', type: 'varchar', transformer: transformerTime })
  createTime: Date;

  @Index()
  @Column({ name: 'updated_at', comment: '更新时间', type: 'varchar', transformer: transformerTime })
  updateTime: Date;

  @Index()
  @Column({ name: 'homestay_id', comment: '民宿ID' })
  homestayId: number;

  @Column({ comment: '房型名称', length: 128 })
  name: string;

  @Column({ comment: '床型（1.8m大床）', length: 64, default: '' })
  bed: string;

  @Column({ comment: '面积㎡', default: 0 })
  area: number;

  @Column({ comment: '最大入住人数', default: 2 })
  maxGuests: number;

  @Column({
    comment: '基础价',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price: number;

  @Column({ comment: '总间数', default: 0 })
  stock: number;

  @Column({ comment: '封面图', length: 500, default: '' })
  cover: string;

  @Column({
    comment: '设施列表',
    type: 'json',
    nullable: true,
  })
  facilities: string[];

  @DeleteDateColumn({ name: 'deleted_at', comment: '删除时间', nullable: true })
  deletedAt: Date;
}
