/**
 * 统一 API 出口：页面禁止直接访问 mock，一律走此层。
 * 后端就绪后将各函数实现替换为 axios 调用，页面代码零改动。
 */
import { ApiError } from '@/mock/server'

export { ApiError }

export function unwrapError(e: unknown): { code: number; message: string } {
  if (e instanceof ApiError) return { code: e.code, message: e.message }
  return { code: 9001, message: '系统繁忙，请稍后再试' }
}

export * from './modules'
