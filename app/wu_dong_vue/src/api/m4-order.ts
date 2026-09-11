import type { Order, OrderType } from '@/types'
import type { Envelope } from './contracts'
import { apiFetch } from './http'

/**
 * 购物车结算 / 门票路线下单入参。
 * 餐位、民宿预订已改为各自模块入口（见 order.ts 的 createMealBooking / createLodgingBooking），
 * 本函数保留给实物商品购物车与门票/路线结算。
 */
export interface CreateOrderPayload {
  type: OrderType
  title: string
  cover: string
  summary: string
  amount: number
  qty: number
  shop: string
  cartItemIds?: string[]
  scenicId?: string
  ticketId?: string
  routeId?: string
  travelDate?: string
  contactName?: string
  contactPhone?: string
}

export function createOrder(payload: CreateOrderPayload): Promise<Envelope<Order>> {
  return apiFetch<Envelope<Order>>('/app/m4/order/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}