import { Provide } from '@midwayjs/core';
import { InjectDataSource, InjectEntityModel } from '@midwayjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FollowEntity } from '../entity/follow_entity';

export interface FollowUserRow {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  followedAt: Date;
}

@Provide()
export class FollowMapper {
  @InjectEntityModel(FollowEntity)
  followRepo: Repository<FollowEntity>;

  @InjectDataSource('default')
  dataSource: DataSource;

  async toggle(followerId: string, followingId: string): Promise<boolean> {
    return this.dataSource.transaction(async (em) => {
      const repo = em.getRepository(FollowEntity);
      const existing = await repo.findOneBy({ followerId, followingId });
      if (existing) {
        await repo.delete(existing.id);
        return false;
      }
      await repo.insert({ followerId, followingId });
      return true;
    });
  }

  listFollowing(userId: string): Promise<FollowUserRow[]> {
    return this.dataSource.query(
      `SELECT u.id, u.name, u.avatar, u.bio, f.created_at AS followedAt
       FROM wudong_common_user_follow f
       JOIN wudong_common_user u ON u.id = f.following_id AND u.deleted_at IS NULL
       WHERE f.follower_id = ?
       ORDER BY f.created_at DESC, f.id DESC`,
      [userId]
    );
  }

  listFollowers(userId: string): Promise<FollowUserRow[]> {
    return this.dataSource.query(
      `SELECT u.id, u.name, u.avatar, u.bio, f.created_at AS followedAt
       FROM wudong_common_user_follow f
       JOIN wudong_common_user u ON u.id = f.follower_id AND u.deleted_at IS NULL
       WHERE f.following_id = ?
       ORDER BY f.created_at DESC, f.id DESC`,
      [userId]
    );
  }
}
