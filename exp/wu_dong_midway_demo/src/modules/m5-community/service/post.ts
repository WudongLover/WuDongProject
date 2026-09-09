import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Like, Repository } from 'typeorm';
import { PostEntity } from '../entity/post';

/**
 * m5-community 模块：社区帖子（骨架示例，表 wudong_m5_post）
 * 后续扩展：评论 wudong_m5_comment、点赞 wudong_m5_post_like
 */
@Provide()
export class PostService {
  @InjectEntityModel(PostEntity)
  postModel: Repository<PostEntity>;

  async page(query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 10;
    const where: any = {};
    if (query.userId) {
      where.user_id = query.userId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.keyword) {
      where.title = Like(`%${query.keyword}%`);
    }
    const [list, total] = await this.postModel.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { list, total, page, size };
  }

  async info(id: number | string) {
    return this.postModel.findOne({ where: { id: id as any } });
  }

  async add(body: Partial<PostEntity>) {
    return this.postModel.save(this.postModel.create(body));
  }

  async update(body: any) {
    const { id, ...rest } = body;
    await this.postModel.update({ id }, rest);
    return this.info(id);
  }

  async remove(id: number | string) {
    await this.postModel.softDelete({ id: id as any });
    return { ok: true };
  }
}
