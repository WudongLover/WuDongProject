/**
 * 收藏实体：映射 wudong_common_favorite（多态，支持 6 种 target_type）
 * 表结构见 scripts/sql/wudong_schema.sql §1.6
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'wudong_common_favorite' })
export class FavoriteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'target_type', length: 16 })
  targetType: string;

  @Column({ name: 'target_id' })
  targetId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}