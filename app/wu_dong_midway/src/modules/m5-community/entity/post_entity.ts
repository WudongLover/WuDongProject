/**
 * 【m5-community 模块】帖子（wudong_m5_post）
 * 表字段映射：列对齐 wudong 库（synchronize=false，禁止自动建表）
 * 注：mysql2 默认连接下 BIGINT 返回 Number、JSON 返回数组；如未来 id 超 2^53 需改 string 型处理
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** 帖子审核状态（与 DDL/前端字面量一致） */
export type PostStatus = 'PENDING' | 'PASSED' | 'REJECTED';

@Entity('wudong_m5_post')
export class PostEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, comment: '作者（PostAuthor.id）' })
  userId: number;


  @Column({ name: 'title', type: 'varchar', length: 128 })
  title: string;

  @Column({ name: 'content', type: 'text', nullable: true })
  content: string;

  @Column({ name: 'images', type: 'json', nullable: true, comment: '配图 URL 数组' })
  images: string[];

  @Column({ name: 'topic', type: 'varchar', length: 64, default: '' })
  topic: string;

  @Column({ name: 'place', type: 'varchar', length: 128, default: '' })
  place: string;

  @Column({ name: 'likes', type: 'int', unsigned: true, default: 0 })
  likes: number;

  @Column({ name: 'collects', type: 'int', unsigned: true, default: 0 })
  collects: number;

  @Column({ name: 'views', type: 'int', unsigned: true, default: 0 })
  views: number;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'PASSED' })
  status: PostStatus;

  @Column({ name: 'published_at', type: 'datetime', nullable: true })
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
