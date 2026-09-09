/**
 * 【m5-community 模块】评论（wudong_m5_comment）
 * 表字段映射：列对齐 wudong 库（synchronize=false，禁止自动建表）
 * 楼中楼回复：扁平存储，parent_id 自关联
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** 评论审核状态（与 DDL/前端字面量一致） */
export type CommentStatus = 'PENDING' | 'PASSED' | 'REJECTED';

@Entity('wudong_m5_comment')
export class CommentEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'post_id', type: 'bigint', unsigned: true })
  postId: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true, comment: '父评论 id，回复时必填' })
  parentId: number | null;

  @Column({ name: 'reply_to_user_id', type: 'bigint', unsigned: true, nullable: true, comment: '被回复人（楼中楼 @）' })
  replyToUserId: number | null;

  @Column({ name: 'content', type: 'varchar', length: 1000 })
  content: string;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'PASSED' })
  status: CommentStatus;

  @Column({ name: 'published_at', type: 'datetime', nullable: true, comment: 'PostComment.date' })
  publishedAt: Date | null;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
