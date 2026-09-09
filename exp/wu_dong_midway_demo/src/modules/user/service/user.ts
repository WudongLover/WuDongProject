import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Like, Repository } from 'typeorm';
import { UserEntity } from '../entity/user';

/**
 * user 模块：C端用户（骨架示例）
 * 提供 page/info/add/update/remove 五个基础方法，各模块认领后可自行扩展业务
 */
@Provide()
export class UserService {
  @InjectEntityModel(UserEntity)
  userModel: Repository<UserEntity>;

  /** 分页列表，支持按昵称 keyword 模糊查询 */
  async page(query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 10;
    const keyword = query.keyword || '';
    const where: any = {};
    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }
    const [list, total] = await this.userModel.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { list, total, page, size };
  }

  /** 详情 */
  async info(id: number | string) {
    return this.userModel.findOne({ where: { id: id as any } });
  }

  /** 新增 */
  async add(body: Partial<UserEntity>) {
    return this.userModel.save(this.userModel.create(body));
  }

  /** 更新（按 id 局部更新） */
  async update(body: any) {
    const { id, ...rest } = body;
    await this.userModel.update({ id }, rest);
    return this.info(id);
  }

  /** 删除（软删除，置 deleted_at） */
  async remove(id: number | string) {
    await this.userModel.softDelete({ id: id as any });
    return { ok: true };
  }
}
