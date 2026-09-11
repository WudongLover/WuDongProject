/**
 * 【m6-agent 模块】对话会话服务
 * 负责会话的创建、查询和消息管理
 */
import { Inject, Provide } from '@midwayjs/core';
import { ChatSessionMapper } from '../mapper/chat_session_mapper';
import { ChatMessageMapper } from '../mapper/chat_message_mapper';
import { ChatRole } from '../entity/chat_message_entity';

@Provide()
export class SessionService {
  @Inject()
  sessionMapper: ChatSessionMapper;

  @Inject()
  messageMapper: ChatMessageMapper;

  /** 创建新会话 */
  async createSession(userId: number | null, deviceId: string, firstMessage: string): Promise<number> {
    const title = firstMessage.slice(0, 30) || '新对话';
    const session = await this.sessionMapper.create({ userId, deviceId, title });
    return session.id;
  }

  /** 保存用户消息 */
  async saveUserMessage(sessionId: number, content: string): Promise<void> {
    await this.messageMapper.create(sessionId, 'user', content);
    await this.sessionMapper.incrementMessageCount(sessionId);
  }

  /** 保存助手回复 */
  async saveAssistantMessage(
    sessionId: number,
    content: string,
    promptTokens = 0,
    completionTokens = 0
  ): Promise<void> {
    await this.messageMapper.create(sessionId, 'assistant', content, promptTokens, completionTokens);
    await this.sessionMapper.incrementMessageCount(sessionId);
  }

  /** 获取会话历史消息（最近 N 条，按时间正序） */
  async getHistory(sessionId: number, limit = 20): Promise<{ role: ChatRole; content: string }[]> {
    const messages = await this.messageMapper.listRecent(sessionId, limit);
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }

  /** 验证会话是否属于当前用户/设备 */
  async verifyOwnership(sessionId: number, userId: number | null, deviceId: string): Promise<boolean> {
    const session = await this.sessionMapper.findById(sessionId);
    if (!session) return false;
    if (userId && session.userId === userId) return true;
    if (!userId && session.deviceId === deviceId) return true;
    return false;
  }

  /** 获取用户/设备的会话列表 */
  async listSessions(userId: number | null, deviceId: string) {
    return this.sessionMapper.listByUser(userId, deviceId);
  }
}
