/**
 * m6-agent 智能体接口
 */
import { apiFetch } from './http'

export interface Envelope<T> {
  code: number
  message: string
  data: T
}

/** 智能体状态 */
export interface AgentStatus {
  available: boolean
}

/** 聊天响应 */
export interface ChatReply {
  sessionId: number
  reply: string
  sources: string[]
}

/** 检查智能体是否可用 */
export function checkAgentStatus(): Promise<Envelope<AgentStatus>> {
  return apiFetch<Envelope<AgentStatus>>('/v1/agent/status')
}

/** 发送消息，获取智能体回复 */
export function sendAgentMessage(
  content: string,
  sessionId?: number | null,
  deviceId?: string
): Promise<Envelope<ChatReply>> {
  return apiFetch<Envelope<ChatReply>>('/v1/agent/chat', {
    method: 'POST',
    body: JSON.stringify({
      content,
      sessionId: sessionId ?? undefined,
      deviceId: deviceId ?? undefined,
    }),
  })
}
