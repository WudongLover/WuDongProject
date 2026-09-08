import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 社区帖子（表 wudong_m5_post，m5 社区模块骨架示例实体）
 */
@Entity('wudong_m5_post')
export class PostEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  /** 作者（对应 wudong_common_user.id） */
  @Column({ type: 'bigint', unsigned: true })
  user_id: number;

  @Column({ type: 'varchar', length: 128 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  /** 配图 URL 数组 */
  @Column({ type: 'json', nullable: true })
  images: string[];

  /** 话题（#苗年节） */
  @Column({ type: 'varchar', length: 64, default: '' })
  topic: string;

  /** 地点打卡 */
  @Column({ type: 'varchar', length: 128, default: '' })
  place: string;

  /** 点赞数（冗余计数） */
  @Column({ type: 'int', unsigned: true, default: 0 })
  likes: number;

  /** 收藏数（冗余计数，写入 common_favorite） */
  @Column({ type: 'int', unsigned: true, default: 0 })
  collects: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  views: number;

  /** PENDING / PASSED / REJECTED */
  @Column({ type: 'varchar', length: 16, default: 'PASSED' })
  status: string;

  /** 发布时间 */
  @Column({ type: 'datetime', nullable: true })
  published_at: Date;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'datetime' })
  deleted_at: Date;
}
