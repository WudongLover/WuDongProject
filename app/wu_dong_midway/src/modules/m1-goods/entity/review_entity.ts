/**
 * 【m1-goods 模块】评价（wudong_common_review）—— 只读
 *
 * ⚠️ 模块边界：本表是多态公共表（target_type = GOODS/SPECIALTY/RESTAURANT/...），
 * 按 CLAUDE.md 约定应由公共模块拥有。当前 order/user 模块尚未落地，
 * 而商品详情页的评价 tab 属于「详情」的组成部分，故先在 m1 内建只读映射。
 *
 * TODO: 公共评价模块（Service）就绪后，删除本 entity 与 review_mapper，
 *       改为注入其 Service 查询，不再由 m1 直接读该表。
 * 本模块只读不写：不提供 insert / update / softDelete。
 */
import { Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** 评价审核状态 */
export type ReviewStatus = 'PENDING' | 'PASSED' | 'REJECTED';

/** DECIMAL → number，对齐前端 Review.rating */
const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string) => Number(value),
};

@Entity('wudong_common_review')
export class ReviewEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  /** 用户昵称快照（前端 Review.user） */
  @Column({ name: 'user_name', type: 'varchar', length: 64, default: '' })
  userName: string;

  /** 头像快照（前端 Review.avatar） */
  @Column({ name: 'user_avatar', type: 'varchar', length: 500, default: '' })
  userAvatar: string;

  /** 多态目标类型，m1 只关心 GOODS / SPECIALTY */
  @Column({ name: 'target_type', type: 'varchar', length: 16 })
  targetType: string;

  /** 多态目标主键，m1 场景下即 wudong_m1_product.id */
  @Column({ name: 'target_id', type: 'bigint' })
  targetId: string;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 5.0,
    transformer: decimalTransformer,
  })
  rating: number;

  @Column({ type: 'varchar', length: 1000 })
  content: string;

  /** 晒图 URL 数组 */
  @Column({ type: 'json', nullable: true })
  images: string[] | null;

  /** 商家回复 */
  @Column({ type: 'varchar', length: 1000, nullable: true })
  reply: string | null;

  @Column({ type: 'varchar', length: 16, default: 'PASSED' })
  status: ReviewStatus;

  /** 前端 Review.date 由本列格式化为 YYYY-MM-DD */
  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  /** 逻辑删除标记：声明后 TypeORM 查询自动过滤已删评价 */
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
