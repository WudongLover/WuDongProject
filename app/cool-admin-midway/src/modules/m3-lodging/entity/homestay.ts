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
 * m3住宿模块-民宿信息
 *
 * 不继承 base/entity 的 BaseEntity：父类已用 @Index() 装饰 createTime/updateTime，
 * 子类再次声明同名属性会让 TypeORM 生成两组同名索引，同步时报 ER_DUP_KEYNAME。
 * 列名与 scripts/sql/wudong_schema.sql 的 wudong_m3_homestay 保持一致。
 */
@Entity('wudong_m3_homestay')
export class M3HomestayEntity {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    unsigned: true,
    comment: 'ID',
  })
  id: number;

  @Index('idx_merchant')
  @Column({
    name: 'merchant_id',
    type: 'bigint',
    unsigned: true,
    default: 0,
    comment: '商家ID',
  })
  merchantId: number;

  @Column({ comment: '民宿名称', length: 128 })
  name: string;

  @Column({ comment: '封面图', length: 500 })
  cover: string;

  @Column({
    comment: '图片列表',
    type: 'json',
    nullable: true,
  })
  images: string[];

  @Column({
    comment: '评分',
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 5.0,
  })
  rating: number;

  @Column({
    comment: '评分明细 {"hygiene":4.9,"location":4.8,"service":5.0}',
    type: 'json',
    nullable: true,
  })
  score: object;

  @Column({
    comment: '标签',
    type: 'json',
    nullable: true,
  })
  tags: string[];

  @Column({
    comment: '设施列表',
    type: 'json',
    nullable: true,
  })
  facilities: string[];

  @Column({ comment: '地址', length: 255, default: '' })
  address: string;

  @Column({ comment: '民宿简介', length: 2000, nullable: true })
  intro: string;

  @Column({
    comment: '入住须知',
    type: 'text',
    nullable: true,
  })
  notice: string;

  @Column({
    comment: '状态',
    length: 16,
    default: 'ENABLED',
  })
  status: string;

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
