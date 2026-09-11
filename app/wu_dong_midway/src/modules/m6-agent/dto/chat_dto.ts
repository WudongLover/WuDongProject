/**
 * 【m6-agent 模块】对话接口 DTO
 */

/** 发送消息请求体 */
export interface ChatSendBody {
  /** 用户输入内容 */
  content?: unknown;
  /** 会话 id，不传则新建会话 */
  sessionId?: unknown;
  /** 未登录用户的设备标识（前端 localStorage 生成的 UUID） */
  deviceId?: unknown;
}

/** 单条消息 VO（返回给前端） */
export interface ChatMessageVo {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

/** 会话 VO */
export interface ChatSessionVo {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

import type { ChatRole } from '../entity/chat_message_entity';
