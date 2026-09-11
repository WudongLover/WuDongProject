/**
 * m6-agent 智能体接口
 */
import { apiFetch } from './http'
import { getAccessToken } from './auth'

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

/** 流式回调 */
export interface AgentStreamHandlers {
  /** 收到会话 id 与引用来源 */
  onMeta?: (meta: { sessionId: number; sources: string[] }) => void
  /** 收到回复增量文本 */
  onDelta: (text: string) => void
}

/**
 * 发送消息，SSE 流式接收智能体回复。
 * 服务端事件序列：meta（会话 id + 来源）→ delta*（增量文本）→ end / error。
 * 返回 AbortController，可用于中断本次生成。
 */
export function streamAgentMessage(
  content: string,
  sessionId: number | null,
  deviceId: string,
  handlers: AgentStreamHandlers
): { abort: () => void; done: Promise<void> } {
  const controller = new AbortController()
  const token = getAccessToken()

  const done = (async () => {
    const res = await fetch('/api/v1/agent/chat/stream', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        content,
        sessionId: sessionId ?? undefined,
        deviceId: deviceId ?? undefined,
      }),
      signal: controller.signal,
    })

    // 参数校验失败等场景后端返回 JSON 信封而非 SSE
    if (!res.ok || !res.body || !(res.headers.get('content-type') || '').includes('text/event-stream')) {
      let message = `请求失败（${res.status}）`
      try {
        const body = await res.json()
        if (body?.message) message = body.message
      } catch {
        // 忽略非 JSON 响应
      }
      throw new Error(message)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const handleEvent = (raw: string) => {
      let event = 'message'
      const dataLines: string[] = []
      for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
      }
      if (!dataLines.length) return
      let payload: any = null
      try {
        payload = JSON.parse(dataLines.join('\n'))
      } catch {
        return
      }
      if (event === 'meta') {
        handlers.onMeta?.(payload)
      } else if (event === 'delta') {
        if (payload?.text) handlers.onDelta(payload.text)
      } else if (event === 'error') {
        throw new Error(payload?.message || '智能体服务暂时不可用')
      }
    }

    while (true) {
      const { done: finished, value } = await reader.read()
      if (finished) break
      buffer += decoder.decode(value, { stream: true })
      let idx = buffer.indexOf('\n\n')
      while (idx !== -1) {
        const raw = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        handleEvent(raw)
        idx = buffer.indexOf('\n\n')
      }
    }
  })()

  return { abort: () => controller.abort(), done }
}

