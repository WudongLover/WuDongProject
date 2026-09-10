import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * m3住宿模块-房型
 *
 * 不继承 base/entity 的 BaseEntity：父类已用 @Index() 装饰 createTime/updateTime，
 * 子类再次声明同名属性会让 TypeORM 生成两组同名索引，同步时报 ER_DUP_KEYNAME。
 * 列名与 scripts/sql/wudong_schema.sql 的 wudong_m3_room_type 保持一致。
 */
@Entity('wudong_m3_room_type')
export class M3RoomTypeEntity {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    unsigned: true,
    comment: 'ID',
  })
  id: number;

  @Index('idx_homestay')
  @Column({
    name: 'homestay_id',
    type: 'bigint',
    unsigned: true,
    comment: '民宿ID',
  })
  homestayId: number;

  @Column({ comment: '房型名称', length: 128 })
  name: string;

  @Column({ comment: '床型（1.8m大床）', length: 64, default: '' })
  bed: string;

  @Column({ comment: '面积㎡', type: 'int', unsigned: true, default: 0 })
  area: number;

  @Column({
    name: 'max_guests',
    comment: '最大入住人数',
    type: 'int',
    unsigned: true,
    default: 2,
  })
  maxGuests: number;

  @Column({
    comment: '基础价',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price: number;

  @Column({ comment: '总间数', type: 'int', unsigned: true, default: 0 })
  stock: number;

  @Column({ comment: '封面图', length: 500, default: '' })
  cover: string;

  @Column({
    comment: '设施列表',
    type: 'json',
    nullable: true,
  })
  facilities: string[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createTime: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updateTime: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    comment: '删除时间',
    nullable: true,
  })
  deletedAt: Date;
}
