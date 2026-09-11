import { Inject, Provide } from '@midwayjs/core';
import { ApiError } from '../../m5-community/error/api_error';
import { FollowMapper, FollowUserRow } from '../mapper/follow_mapper';
import { UserService } from './user_service';

export interface FollowUserVo {
  id: string;
  name: string;
  avatar: string;
  bio: string;
}

@Provide()
export class FollowService {
  @Inject()
  followMapper: FollowMapper;

  @Inject()
  userService: UserService;

  async toggle(followerId: string, followingId: string): Promise<{ following: boolean }> {
    if (!/^\d+$/.test(followingId) || Number(followingId) <= 0) {
      throw new ApiError(1004, '用户 ID 无效');
    }
    if (followerId === followingId) {
      throw new ApiError(1004, '不能关注自己');
    }
    const target = await this.userService.getPublicProfile(followingId);
    if (!target) {
      throw new ApiError(1003, '用户不存在', 404);
    }
    return { following: await this.followMapper.toggle(followerId, followingId) };
  }

  async listFollowing(userId: string): Promise<FollowUserVo[]> {
    return this.toVoList(await this.followMapper.listFollowing(userId));
  }

  async listFollowers(userId: string): Promise<FollowUserVo[]> {
    return this.toVoList(await this.followMapper.listFollowers(userId));
  }

  private toVoList(rows: FollowUserRow[]): FollowUserVo[] {
    return rows.map((row) => ({
      id: String(row.id),
      name: row.name ?? '',
      avatar: row.avatar ?? '',
      bio: row.bio ?? '',
    }));
  }
}
