import { BaseEntity, transformerTime } from '../../base/entity/base';
import { Column, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * m3住宿模块-民宿信息
 */
@Entity('wudong_m3_homestay')
export class M3HomestayEntity extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { comment: 'ID' })
  id: number;

  @Column({ name: 'created_at', comment: '创建时间', type: 'varchar', transformer: transformerTime })
  createTime: Date;

  @Column({ name: 'updated_at', comment: '更新时间', type: 'varchar', transformer: transformerTime })
  updateTime: Date;

  @Index()
  @Column({ name: 'merchant_id', comment: '商家ID', default: 0 })
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

  @DeleteDateColumn({ name: 'deleted_at', comment: '删除时间', nullable: true })
  deletedAt: Date;
}
