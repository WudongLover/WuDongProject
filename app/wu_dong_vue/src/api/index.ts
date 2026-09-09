/**
 * 统一 API 出口：页面禁止直接访问 mock，一律走此层。
 * 页面只通过此层访问后端，避免散落请求细节。
 */
import { ApiError } from './contracts'

export { ApiError }

export function unwrapError(e: unknown): { code: number; message: string } {
  if (e instanceof ApiError) return { code: e.code, message: e.message }
  return { code: 9001, message: '系统繁忙，请稍后再试' }
}

export * from './modules'
