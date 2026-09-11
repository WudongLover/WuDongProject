import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MessageEntity, MessageType } from '../entity/message_entity';

export interface CreateMessageInput {
  userId: string;
  type: MessageType;
  title: string;
  content: string;
  relatedType?: string | null;
  relatedId?: string | null;
}

@Provide()
export class MessageMapper {
  @InjectEntityModel(MessageEntity)
  messageRepo: Repository<MessageEntity>;

  listByUser(userId: string): Promise<MessageEntity[]> {
    return this.messageRepo.find({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  findOwned(userId: string, id: string): Promise<MessageEntity | null> {
    return this.messageRepo.findOneBy({ id, userId });
  }

  async markRead(userId: string, id: string): Promise<boolean> {
    const result = await this.messageRepo.update({ id, userId }, { isRead: 1 });
    return result.affected === 1;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.messageRepo.update(
      { userId, isRead: 0 },
      { isRead: 1 }
    );
    return result.affected ?? 0;
  }

  countUnread(userId: string): Promise<number> {
    return this.messageRepo.countBy({ userId, isRead: 0 });
  }

  async create(input: CreateMessageInput, em?: EntityManager): Promise<MessageEntity> {
    const repo = em ? em.getRepository(MessageEntity) : this.messageRepo;
    return repo.save(
      repo.create({
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        isRead: 0,
        relatedType: input.relatedType ?? null,
        relatedId: input.relatedId ?? null,
      })
    );
  }
}
