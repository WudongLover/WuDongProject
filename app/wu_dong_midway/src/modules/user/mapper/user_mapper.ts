import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';

export interface UserStatsRow {
  favorites: number;
  unreadMessages: number;
  likesReceived: number;
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
           WHERE user_id = ? AND status = 'PASSED' AND deleted_at IS NULL) AS likesReceived`,
      [userId, userId, userId]
    );
    const row = rows?.[0] ?? {};
    return {
      favorites: Number(row.favorites) || 0,
      unreadMessages: Number(row.unreadMessages) || 0,
      likesReceived: Number(row.likesReceived) || 0,
    };
  }
}
