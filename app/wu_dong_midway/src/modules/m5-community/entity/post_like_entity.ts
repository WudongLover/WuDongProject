/**
 * 【m5-community 模块】点赞（wudong_m5_post_like）
 * 表字段映射：列对齐 wudong 库（synchronize=false，禁止自动建表）
 * 判重依赖唯一键 uk_post_user（post_id, user_id）
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wudong_m5_post_like')
export class PostLikeEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'post_id', type: 'bigint', unsigned: true })
  postId: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
