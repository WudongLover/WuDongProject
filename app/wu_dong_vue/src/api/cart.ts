import type { CartItem } from '@/types'

interface Envelope<T> { code: number; message: string; data: T }

async function request<T>(path: string, init: RequestInit = {}): Promise<Envelope<T>> {
  const user = sessionStorage.getItem('wudong_user')
  let userId = '1'
  try { userId = String(JSON.parse(user || '{}').id || 1) } catch {}
  const response = await fetch(`/api/cart${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-user-id': userId, ...init.headers },
  })
  const body = await response.json()
  if (!response.ok || body.code !== 0) throw new Error(body.message || '购物车请求失败')
  return body as Envelope<T>
}

export const cartApi = {
  list: () => request<CartItem[]>('/'),
  add: (payload: { productId: string; skuId?: string; qty: number; shop?: string }) => request<CartItem[]>('/', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, patch: { qty?: number; checked?: boolean }) => request<CartItem[]>(`/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  remove: (id: string) => request<CartItem[]>(`/${id}`, { method: 'DELETE' }),
  check: () => request<{ invalidIds: string[] }>('/check', { method: 'POST' }),
}
