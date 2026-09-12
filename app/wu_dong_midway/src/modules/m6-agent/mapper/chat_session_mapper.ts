/**
 * 【m6-agent 模块】对话会话 Mapper
 */
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSessionEntity } from '../entity/chat_session_entity';

@Provide()
export class ChatSessionMapper {
  @InjectEntityModel(ChatSessionEntity)
  repo: Repository<ChatSessionEntity>;

  async create(data: Partial<ChatSessionEntity>): Promise<ChatSessionEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findById(id: number): Promise<ChatSessionEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async listByUser(userId: string | null, deviceId: string, limit = 20): Promise<ChatSessionEntity[]> {
    const qb = this.repo.createQueryBuilder('s').orderBy('s.updated_at', 'DESC').limit(limit);
    if (userId) {
      qb.where('s.user_id = :userId', { userId });
    } else {
      qb.where('s.device_id = :deviceId', { deviceId });
    }
    return qb.getMany();
  }

  async updateTitle(id: number, title: string): Promise<void> {
    await this.repo.update(id, { title });
  }

  async incrementMessageCount(id: number): Promise<void> {
    await this.repo.increment({ id }, 'messageCount', 1);
  }
}
