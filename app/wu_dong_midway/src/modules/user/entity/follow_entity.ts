import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wudong_common_user_follow')
export class FollowEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'follower_id', type: 'bigint', unsigned: true })
  followerId: string;

  @Column({ name: 'following_id', type: 'bigint', unsigned: true })
  followingId: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
