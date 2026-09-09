import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { M4ScenicEntity } from '../entity/scenic';
import { M4TicketEntity } from '../entity/ticket';

@Provide()
export class M4ScenicService {
  @InjectEntityModel(M4ScenicEntity)
  scenicEntity: Repository<M4ScenicEntity>;

  @InjectEntityModel(M4TicketEntity)
  ticketEntity: Repository<M4TicketEntity>;

  async list() {
    const scenics = await this.scenicEntity.find({
      where: { status: 'ENABLED' },
      order: { id: 'DESC' },
    });
    const tickets = await this.ticketEntity.find({ order: { id: 'DESC' } });
    const ticketMap = new Map<number, M4TicketEntity[]>();
    for (const ticket of tickets) {
      const list = ticketMap.get(ticket.scenicId) ?? [];
      list.push(ticket);
      ticketMap.set(ticket.scenicId, list);
    }
    return scenics.map((scenic) => ({
      ...scenic,
      intro: scenic.intro ?? '',
      rating: Number(scenic.rating),
      tickets: (ticketMap.get(scenic.id) ?? []).map((ticket) => ({
        ...ticket,
        price: Number(ticket.price),
      })),
    }));
  }
}
