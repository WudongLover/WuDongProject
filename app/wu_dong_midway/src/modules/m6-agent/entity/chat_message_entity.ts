/**
 * 【m6-agent 模块】对话消息（wudong_m6_chat_message）
 * 每条消息记录 role / content / token 用量，便于排查和成本核算
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ChatRole = 'user' | 'assistant' | 'system';

@Entity('wudong_m6_chat_message')
export class ChatMessageEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'session_id', type: 'bigint', unsigned: true })
  sessionId: number;

  @Column({ name: 'role', type: 'varchar', length: 16 })
  role: ChatRole;

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({ name: 'prompt_tokens', type: 'int', unsigned: true, default: 0 })
  promptTokens: number;

  @Column({ name: 'completion_tokens', type: 'int', unsigned: true, default: 0 })
  completionTokens: number;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
