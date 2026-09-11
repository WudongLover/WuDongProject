import { Inject, Provide } from '@midwayjs/core';
import { EntityManager } from 'typeorm';
import { ApiError } from '../../m5-community/error/api_error';
import { MessageEntity, MessageType } from '../entity/message_entity';
import { CreateMessageInput, MessageMapper } from '../mapper/message_mapper';

export interface MessageVo {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  date: string;
  read: boolean;
  relatedType: string | null;
  relatedId: string | null;
}

@Provide()
export class MessageService {
  @Inject()
  messageMapper: MessageMapper;

  async list(userId: string): Promise<MessageVo[]> {
    return (await this.messageMapper.listByUser(userId)).map((item) => this.toVo(item));
  }

  async markRead(userId: string, id: string): Promise<boolean> {
    const changed = await this.messageMapper.markRead(userId, id);
    if (!changed && !(await this.messageMapper.findOwned(userId, id))) {
      throw new ApiError(1003, '消息不存在', 404);
    }
    return true;
  }

  async markAllRead(userId: string): Promise<{ affected: number }> {
    return { affected: await this.messageMapper.markAllRead(userId) };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    return { count: await this.messageMapper.countUnread(userId) };
  }

  async send(input: CreateMessageInput, em?: EntityManager): Promise<MessageEntity> {
    return this.messageMapper.create(input, em);
  }

  private toVo(item: MessageEntity): MessageVo {
    return {
      id: String(item.id),
      type: item.type,
      title: item.title,
      content: item.content,
      date: this.formatDate(item.createdAt),
      read: item.isRead === 1,
      relatedType: item.relatedType,
      relatedId: item.relatedId,
    };
  }

  private formatDate(value: Date): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  }
}
