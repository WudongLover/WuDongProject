import { Inject, Provide } from '@midwayjs/core';
import { PublicUserRow, UserMapper, UserStatsRow } from '../mapper/user_mapper';

@Provide()
export class UserService {
  @Inject()
  userMapper: UserMapper;

  getStats(userId: string): Promise<UserStatsRow> {
    return this.userMapper.getStats(userId);
  }

  getPublicProfile(userId: string, currentUserId?: string): Promise<PublicUserRow | null> {
    return this.userMapper.getPublicProfile(userId, currentUserId);
  }
}
