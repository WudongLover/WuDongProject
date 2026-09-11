/** 轻量 HTTP 客户端：后端统一信封 { code, message, data }。 */
import { ApiError } from './contracts'
import { getAccessToken } from './auth'
import { localizeImage } from '@/mock/image-map'

const BASE = '/api'

/** 深度遍历响应体，把已知的远程图片 URL 换成本地路径 */
function localizeDeep(value: unknown): unknown {
  if (typeof value === 'string') return localizeImage(value)
  if (Array.isArray(value)) return value.map(localizeDeep)
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      ;(value as Record<string, unknown>)[key] = localizeDeep(
        (value as Record<string, unknown>)[key],
      )
    }
  }
  return value
}

/**
 * 发起请求，自动解包信封。
 * code !== 0 时抛 ApiError（与前端已有的错误处理兼容）。
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'content-type': 'application/json',
      'x-user-id': getMockUserId(),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  })

  const body = localizeDeep(await res.json())

  if (!res.ok || body?.code !== 0) {
    throw new ApiError(body?.code ?? res.status, body?.message ?? '请求失败')
  }
  // 返回完整信封，调用方按模块解包 data。
  return body as T
}

/**
 * X-User-Id 联调兜底值：m1 购物车、m5 社区在未携带合法 token 时按此头识别身份
 * （后端仅非生产环境读取，见 cart_controller.userId / post_service.currentUserId）。
 * 已登录取 sessionStorage 里的当前用户，未登录回落 '1'（与后端 DEMO_USER_ID 一致）。
 */
function getMockUserId(): string {
  try {
    const raw = sessionStorage.getItem('wudong_user')
    if (raw) {
      const id = JSON.parse(raw)?.id
      if (id) return String(id)
    }
  } catch {}
  return '1'
}
