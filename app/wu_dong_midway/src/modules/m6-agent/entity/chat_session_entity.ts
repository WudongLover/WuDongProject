/**
 * 【m6-agent 模块】对话会话（wudong_m6_chat_session）
 * 一次对话 = 一个 session，包含多条 message
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wudong_m6_chat_session')
export class ChatSessionEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true, comment: '登录用户 id，未登录为 null' })
  userId: number | null;

  @Column({ name: 'device_id', type: 'varchar', length: 64, default: '', comment: '未登录用户的设备标识' })
  deviceId: string;

  @Column({ name: 'title', type: 'varchar', length: 100, default: '' })
  title: string;

  @Column({ name: 'message_count', type: 'int', unsigned: true, default: 0 })
  messageCount: number;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
