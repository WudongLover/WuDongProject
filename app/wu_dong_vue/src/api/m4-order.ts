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
  /** 购物车结算：待并入本单的购物车项 */
  cartItemIds?: string[]
  /** TICKET */
  scenicId?: string
  ticketId?: string
  /** ROUTE */
  routeId?: string
  /** TICKET / ROUTE */
  travelDate?: string
  /** LODGING */
  homestayId?: string
  roomTypeId?: string
  checkIn?: string
  checkOut?: string
  /** MEAL */
  restaurantId?: string
  slotId?: string
  diningDate?: string
  diningTime?: string
  /** MEAL / LODGING，缺省 1 */
  guests?: number
  contactName?: string
  contactPhone?: string
}

export function createOrder(payload: CreateOrderPayload): Promise<Envelope<Order>> {
  return apiFetch<Envelope<Order>>('/app/m4/order/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}