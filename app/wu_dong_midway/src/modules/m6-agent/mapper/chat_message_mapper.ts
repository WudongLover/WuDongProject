/**
 * 【m6-agent 模块】对话消息 Mapper
 */
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessageEntity, ChatRole } from '../entity/chat_message_entity';

@Provide()
export class ChatMessageMapper {
  @InjectEntityModel(ChatMessageEntity)
  repo: Repository<ChatMessageEntity>;

  async create(
    sessionId: number,
    role: ChatRole,
    content: string,
    promptTokens = 0,
    completionTokens = 0
  ): Promise<ChatMessageEntity> {
    const entity = this.repo.create({ sessionId, role, content, promptTokens, completionTokens });
    return this.repo.save(entity);
  }

  /** 获取会话最近 N 条消息（按时间正序，用于 LLM 上下文） */
  async listRecent(sessionId: number, limit = 20): Promise<ChatMessageEntity[]> {
    const rows = await this.repo.find({
      where: { sessionId },
      order: { id: 'DESC' },
      take: limit,
    });
    return rows.reverse();
  }
}
