import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Like, Repository } from 'typeorm';
import { OrderEntity } from '../entity/order';

/**
 * order 模块：公共订单链路（骨架示例，表 wudong_common_order）
 * 后续扩展：checkout 拆单 → 订单快照 → payment → order_event → mX_order_ext
 */
@Provide()
export class OrderService {
  @InjectEntityModel(OrderEntity)
  orderModel: Repository<OrderEntity>;

  async page(query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 10;
    const where: any = {};
    if (query.userId) {
      where.user_id = query.userId;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.keyword) {
      where.title = Like(`%${query.keyword}%`);
    }
    const [list, total] = await this.orderModel.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { list, total, page, size };
  }

  async info(id: number | string) {
    return this.orderModel.findOne({ where: { id: id as any } });
  }

  async add(body: Partial<OrderEntity>) {
    return this.orderModel.save(this.orderModel.create(body));
  }

  async update(body: any) {
    const { id, ...rest } = body;
    await this.orderModel.update({ id }, rest);
    return this.info(id);
  }

  async remove(id: number | string) {
    await this.orderModel.softDelete({ id: id as any });
    return { ok: true };
  }
}
