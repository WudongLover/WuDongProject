/**
 * 【m1-goods 模块】评价（wudong_common_review）—— 只读
 * mapper 层：数据访问
 *
 * ⚠️ 见 entity/review_entity.ts 的模块边界说明：本文件是公共表落地前的临时读取通道，
 *    只提供查询，不提供任何写入方法。
 */
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from '../entity/review_entity';

@Provide()
export class ReviewMapper {
  @InjectEntityModel(ReviewEntity)
  reviewModel: Repository<ReviewEntity>;

  /**
   * 查询某个目标的已过审评价（deleted_at 由 @DeleteDateColumn 自动过滤）
   * @param targetType m1 场景传 GOODS / SPECIALTY
   * @param targetId   商品主键
   */
  async findPassedByTarget(
    targetType: string,
    targetId: string
  ): Promise<ReviewEntity[]> {
    return this.reviewModel.find({
      where: { targetType, targetId, status: 'PASSED' },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }
}
