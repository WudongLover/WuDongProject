import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { FavoriteEntity } from '../entity/favorite_entity';

export interface FavoriteRow {
  id: number;
  targetType: string;
  targetId: number;
  createdAt: Date;
}

export interface ToggleResult {
  /** 操作后是否处于收藏状态 */
  favorited: boolean;
}

@Provide()
export class FavoriteMapper {
  @InjectDataSource('default')
  dataSource: DataSource;

  /**
   * 反转收藏状态：靠 uk_user_target 唯一键实现 toggle
   * 先删后插 → 成功则 favorited=true，affected=0 表示已在→ favorited=false
   * 并发安全由唯一键兜底（重复插入 1062 回退为已收藏）
   */
  async toggle(userId: number, targetType: string, targetId: number): Promise<ToggleResult> {
    const repo = this.dataSource.getRepository(FavoriteEntity);
    const existing = await repo.findOne({ where: { userId, targetType, targetId } });
    if (existing) {
      await repo.delete(existing.id);
      return { favorited: false };
    }
    try {
      await repo.insert({ userId, targetType, targetId });
      return { favorited: true };
    } catch (err: any) {
      if (err?.errno === 1062) {
        return { favorited: true };
      }
      throw err;
    }
  }

  /** 检查单个目标是否已收藏 */
  async check(userId: number, targetType: string, targetId: number): Promise<boolean> {
    const row = await this.dataSource.getRepository(FavoriteEntity).findOne({
      where: { userId, targetType, targetId },
      select: ['id'],
    });
    return !!row;
  }

  /** 当前用户所有收藏 */
  async listByUser(userId: number): Promise<FavoriteRow[]> {
    return this.dataSource
      .getRepository(FavoriteEntity)
      .createQueryBuilder('f')
      .select('f.id', 'id')
      .addSelect('f.target_type', 'targetType')
      .addSelect('f.target_id', 'targetId')
      .addSelect('f.created_at', 'createdAt')
      .where('f.user_id = :userId', { userId })
      .orderBy('f.created_at', 'DESC')
      .getRawMany<FavoriteRow>();
  }
}