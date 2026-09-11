/** 轻量 HTTP 客户端：后端统一信封 { code, message, data }。 */
import { ApiError } from './contracts'
import { getAccessToken, refreshAccess } from './auth'
import { emitUnauthorized } from './session'
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
 * 发起请求并解包信封：
 * - 身份统一走 Authorization: Bearer（不再注入 X-User-Id 头）；
 * - 401/1001 时先用 refresh Cookie 续期并重放一次，仍失败则触发统一登出；
 * - code !== 0 时抛 ApiError（与前端已有的错误处理兼容）。
 */
async function request(path: string, init: RequestInit | undefined, retried: boolean): Promise<any> {
  const token = getAccessToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...((init?.headers as Record<string, string>) || {}),
    },
  })

  let body: any = null
  try {
    body = localizeDeep(await res.json())
  } catch {
    // 非 JSON 响应（如框架 404 HTML）按状态码兜底
    body = null
  }

  if (!res.ok || body?.code !== 0) {
    const code = body?.code ?? res.status
    const message =
      body?.message ??
      (res.status === 401 ? '登录已过期，请重新登录' : `请求失败（${res.status}）`)
    if (res.status === 401 || code === 1001) {
      if (!retried && (await refreshAccess())) {
        return request(path, init, true)
      }
      emitUnauthorized(path)
    }
    throw new ApiError(code, message)
  }
  // 返回完整信封，调用方按模块解包 data。
  return body
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return (await request(path, init, false)) as T
}
