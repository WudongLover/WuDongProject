import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Like, Repository } from 'typeorm';
import { TicketEntity } from '../entity/ticket';

/**
 * m4-ticket 模块：门票/路线（骨架示例，表 wudong_m4_ticket）
 * 后续扩展：景区 wudong_m4_scenic、路线 wudong_m4_route / wudong_m4_route_day
 */
@Provide()
export class TicketService {
  @InjectEntityModel(TicketEntity)
  ticketModel: Repository<TicketEntity>;

  async page(query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 10;
    const where: any = {};
    if (query.scenicId) {
      where.scenic_id = query.scenicId;
    }
    if (query.keyword) {
      where.name = Like(`%${query.keyword}%`);
    }
    const [list, total] = await this.ticketModel.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { list, total, page, size };
  }

  async info(id: number | string) {
    return this.ticketModel.findOne({ where: { id: id as any } });
  }

  async add(body: Partial<TicketEntity>) {
    return this.ticketModel.save(this.ticketModel.create(body));
  }

  async update(body: any) {
    const { id, ...rest } = body;
    await this.ticketModel.update({ id }, rest);
    return this.info(id);
  }

  async remove(id: number | string) {
    await this.ticketModel.softDelete({ id: id as any });
    return { ok: true };
  }
}
