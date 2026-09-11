import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';

export interface UserStatsRow {
  favorites: number;
  unreadMessages: number;
  likesReceived: number;
  following: number;
  followers: number;
}

export interface PublicUserRow {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  postCount: number;
  likesReceived: number;
  followingCount: number;
  followerCount: number;
  isFollowing: boolean;
}

@Provide()
export class UserMapper {
  @InjectDataSource('default')
  dataSource: DataSource;

  async getStats(userId: string): Promise<UserStatsRow> {
    const rows = await this.dataSource.query(
      `SELECT
         (SELECT COUNT(*) FROM wudong_common_favorite WHERE user_id = ?) AS favorites,
         (SELECT COUNT(*) FROM wudong_common_message
           WHERE user_id = ? AND is_read = 0 AND deleted_at IS NULL) AS unreadMessages,
         (SELECT COALESCE(SUM(likes), 0) FROM wudong_m5_post
           WHERE user_id = ? AND status = 'PASSED' AND deleted_at IS NULL) AS likesReceived,
         (SELECT COUNT(*) FROM wudong_common_user_follow
           WHERE follower_id = ?) AS following,
         (SELECT COUNT(*) FROM wudong_common_user_follow
           WHERE following_id = ?) AS followers`,
      [userId, userId, userId, userId, userId]
    );
    const row = rows?.[0] ?? {};
    return {
      favorites: Number(row.favorites) || 0,
      unreadMessages: Number(row.unreadMessages) || 0,
      likesReceived: Number(row.likesReceived) || 0,
      following: Number(row.following) || 0,
      followers: Number(row.followers) || 0,
    };
  }

  async getPublicProfile(userId: string, currentUserId?: string): Promise<PublicUserRow | null> {
    const viewerId = currentUserId || '0';
    const rows = await this.dataSource.query(
      `SELECT
         u.id,
         u.name,
         u.avatar,
         u.bio,
         (SELECT COUNT(*) FROM wudong_m5_post
           WHERE user_id = u.id AND status = 'PASSED' AND deleted_at IS NULL) AS postCount,
         (SELECT COALESCE(SUM(likes), 0) FROM wudong_m5_post
           WHERE user_id = u.id AND status = 'PASSED' AND deleted_at IS NULL) AS likesReceived,
         (SELECT COUNT(*) FROM wudong_common_user_follow
           WHERE follower_id = u.id) AS followingCount,
         (SELECT COUNT(*) FROM wudong_common_user_follow
           WHERE following_id = u.id) AS followerCount,
         EXISTS(
           SELECT 1 FROM wudong_common_user_follow
           WHERE follower_id = ? AND following_id = u.id
         ) AS isFollowing
       FROM wudong_common_user u
       WHERE u.id = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [viewerId, userId]
    );
    const row = rows?.[0];
    if (!row) return null;
    return {
      id: String(row.id),
      name: row.name ?? '',
      avatar: row.avatar ?? '',
      bio: row.bio ?? '',
      postCount: Number(row.postCount) || 0,
      likesReceived: Number(row.likesReceived) || 0,
      followingCount: Number(row.followingCount) || 0,
      followerCount: Number(row.followerCount) || 0,
      isFollowing: Boolean(Number(row.isFollowing)),
    };
  }
}
