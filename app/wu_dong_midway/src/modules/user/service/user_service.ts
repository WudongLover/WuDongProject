import { Inject, Provide } from '@midwayjs/core';
import { UserMapper, UserStatsRow } from '../mapper/user_mapper';

@Provide()
export class UserService {
  @Inject()
  userMapper: UserMapper;

  getStats(userId: string): Promise<UserStatsRow> {
    return this.userMapper.getStats(userId);
  }
}
