/**
 * 购物车真实后端接口（wu_dong_midway /api/cart）
 * 身份统一走 Authorization: Bearer（apiFetch 注入），后端按 ctx.userId 归属数据；
 * 已移除 X-User-Id 头，未登录一律 401。
 */
import type { CartItem } from '@/types'
import type { Envelope } from './contracts'
import { apiFetch } from './http'

export const cartApi = {
  list: () => apiFetch<Envelope<CartItem[]>>('/cart/'),
  add: (payload: { productId: string; skuId?: string; qty: number; shop?: string }) =>
    apiFetch<Envelope<CartItem[]>>('/cart/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, patch: { qty?: number; checked?: boolean }) =>
    apiFetch<Envelope<CartItem[]>>(`/cart/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),
  remove: (id: string) => apiFetch<Envelope<CartItem[]>>(`/cart/${id}`, { method: 'DELETE' }),
  check: () => apiFetch<Envelope<{ invalidIds: string[] }>>('/cart/check', { method: 'POST' }),
}
