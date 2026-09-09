/** 轻量 HTTP 客户端：后端统一信封 { code, message, data }。 */
import { ApiError } from './contracts'

const BASE = '/api'

/**
 * 发起请求，自动解包信封。
 * code !== 0 时抛 ApiError（与前端已有的错误处理兼容）。
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'content-type': 'application/json',
      'x-user-id': getMockUserId(),
      ...init?.headers,
    },
    ...init,
  })

  const body = await res.json()

  if (!res.ok || body?.code !== 0) {
    throw new ApiError(body?.code ?? res.status, body?.message ?? '请求失败')
  }
  // 返回完整信封，调用方按模块解包 data。
  return body as T
}

/**
 * 模拟用户 ID：localStorage 读取，缺省 '1'（与后端 DEMO_USER_ID 兜底一致）
 * 待登录鉴权模块实现后替换为真实 token
 */
function getMockUserId(): string {
  try {
    const u = localStorage.getItem('wudong_user')
    if (u) {
      const parsed = JSON.parse(u)
      if (parsed?.id) return String(parsed.id)
    }
  } catch {}
  return '1'
}
