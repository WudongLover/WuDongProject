import { CoolCommException } from '@cool-midway/core';
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { M4TicketEntity } from '../entity/ticket';

export interface TicketPageQuery {
  page?: number | string;
  size?: number | string;
  keyword?: string;
  scenicId?: number | string;
}

export interface TicketAddPayload {
  scenicId: number;
  name: string;
  price: number | string;
  stock?: number;
  note?: string;
}

@Provide()
export class M4TicketService {
  @InjectEntityModel(M4TicketEntity)
  ticketEntity: Repository<M4TicketEntity>;

  async page(query: TicketPageQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.min(100, Math.max(1, Number(query.size) || 10));
    const builder = this.ticketEntity
      .createQueryBuilder('ticket')
      .orderBy('ticket.id', 'DESC');

    if (query.scenicId !== undefined && query.scenicId !== '') {
      builder.andWhere('ticket.scenic_id = :scenicId', {
        scenicId: Number(query.scenicId),
      });
    }
    if (query.keyword?.trim()) {
      builder.andWhere('ticket.name LIKE :keyword', {
        keyword: `%${query.keyword.trim()}%`,
      });
    }

    const [list, total] = await builder
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();
    return { list, total, page, size };
  }

  async info(id: number | string) {
    const ticket = await this.ticketEntity.findOneBy({ id: Number(id) });
    if (!ticket) throw new CoolCommException('门票不存在或已删除');
    return ticket;
  }

  async add(payload: TicketAddPayload) {
    if (!payload.name?.trim() || !Number(payload.scenicId)) {
      throw new CoolCommException('景点和票名不能为空');
    }
    const price = Number(payload.price);
    const stock = Number(payload.stock ?? 0);
    if (!Number.isFinite(price) || !Number.isFinite(stock) || price < 0 || stock < 0) {
      throw new CoolCommException('价格和库存必须是非负数字');
    }
    return this.ticketEntity.save(
      this.ticketEntity.create({
        scenicId: Number(payload.scenicId),
        name: payload.name.trim(),
        price: String(price),
        stock,
        note: payload.note?.trim() || '',
      })
    );
  }

  async remove(id: number | string) {
    await this.info(id);
    await this.ticketEntity.softDelete(Number(id));
    return true;
  }
}
