import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from '../entity/message_entity';

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
}
