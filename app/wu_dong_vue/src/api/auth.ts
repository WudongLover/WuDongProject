/**
 * 真实后端认证接口（对接 wu_dong_midway C 端服务 /api/user/*，见 vite.config.ts 的 /api 代理）
 * access token 只保存在本模块内存中；refresh token 走 HttpOnly Cookie。
 */
import type { UserProfile, UserStats } from '@/types'
import { ApiError } from '@/mock/server'

const BASE = '/api/user'

export interface Envelope<T> {
  code: number
  message: string
  data: T
}

export interface LoginResult {
  token: string
  expire: number
  user: UserProfile
}

interface HttpOptions {
  method?: 'GET' | 'POST'
  body?: unknown
}

interface JsonEnvelope<T> {
  code?: number
  message?: string
  data?: T
}

class HttpApiError extends ApiError {
  status: number
  constructor(status: number, code: number, message: string) {
    super(code, message)
    this.status = status
  }
}

let accessToken = ''
let refreshing: Promise<boolean> | null = null

export function setAccessToken(token: string) {
  accessToken = token
}

export function hasAccessToken() {
  return !!accessToken
}

/** 供通用 http 客户端注入 Authorization 头 */
export function getAccessToken() {
  return accessToken
}

async function request<T>(
  path: string,
  options: HttpOptions = {},
  withAuth = false,
): Promise<Envelope<T>> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (withAuth && accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(BASE + path, {
    method: options.method || 'GET',
    credentials: 'same-origin',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  let payload: JsonEnvelope<T> | null = null
  try {
    payload = (await res.json()) as JsonEnvelope<T>
  } catch {
    payload = null
  }

  if (payload && typeof payload.code === 'number') {
    // Cool Admin 成功码为 1000，本地 Mock 历史成功码为 0
    if (payload.code !== 1000 && payload.code !== 0) {
      throw new ApiError(payload.code, payload.message || '请求失败')
    }
    return payload as Envelope<T>
  }

  const message =
    payload?.message || (res.status === 401 ? '登录已过期，请重新登录' : `请求失败（${res.status}）`)
  throw new HttpApiError(res.status, res.status === 401 ? 1001 : 9001, message)
}

/** 用 HttpOnly Cookie 中的 refresh token 换取新 access token */
export async function refreshAccess(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await request<LoginResult>('/refresh', { method: 'POST' })
        accessToken = res.data.token
        return true
      } catch {
        accessToken = ''
        return false
      }
    })()
  }
  try {
    return await refreshing
  } finally {
    refreshing = null
  }
}

export async function sendSmsCode(phone: string): Promise<Envelope<{ sent: boolean; hint: string }>> {
  return request('/sms-code', { method: 'POST', body: { phone } })
}

async function loginBy(path: string, body: unknown) {
  const res = await request<LoginResult>(path, { method: 'POST', body })
  accessToken = res.data.token
  return res
}

export async function login(payload: { phone: string; password?: string; smsCode?: string }) {
  return loginBy(payload.smsCode != null ? '/login-sms' : '/login-password', payload)
}

export async function register(payload: {
  phone: string
  smsCode: string
  password: string
  name: string
}) {
  return loginBy('/register', payload)
}

/** 应用启动恢复登录态：无 access 时用 Cookie 刷新并拉取当前用户 */
export async function fetchMe(): Promise<Envelope<UserProfile>> {
  if (!accessToken) {
    const ok = await refreshAccess()
    if (!ok) throw new ApiError(1001, '未登录')
  }
  try {
    return await request<UserProfile>('/me', {}, true)
  } catch (e) {
    if (await refreshAccess()) {
      return request<UserProfile>('/me', {}, true)
    }
    throw e
  }
}

export async function logout() {
  try {
    await request('/logout', { method: 'POST' })
  } finally {
    accessToken = ''
  }
}

export async function updateProfile(patch: Partial<Pick<UserProfile, 'name' | 'bio'>>) {
  const res = await request<UserProfile>('/profile', { method: 'POST', body: patch }, true)
  return res
}

/**
 * 设置/修改登录密码（需登录）
 * 未设置过密码时只传 newPassword；已设置密码时必须带 oldPassword。
 */
export async function setPassword(payload: { newPassword: string; oldPassword?: string }) {
  return request<UserProfile>('/password', { method: 'POST', body: payload }, true)
}

export async function getUserStats(): Promise<Envelope<UserStats>> {
  return request<UserStats>('/stats', {}, true)
}
