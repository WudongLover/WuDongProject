import type { Order, OrderStatus, OrderType } from '@/types'
import type { Envelope } from './contracts'
import { apiFetch } from './http'

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

export function getOrders(filter?: { type?: OrderType | 'ALL'; status?: OrderStatus | 'ALL' }): Promise<Envelope<Order[]>> {
  const params = new URLSearchParams()
  if (filter?.type && filter.type !== 'ALL') params.set('type', filter.type)
  if (filter?.status && filter.status !== 'ALL') params.set('status', filter.status)
  const query = params.toString()
  return apiFetch<Envelope<Order[]>>(`/app/m4/order/list${query ? `?${query}` : ''}`)
}

function orderAction(action: 'pay' | 'cancel' | 'refund', orderNo: string): Promise<Envelope<Order>> {
  return apiFetch<Envelope<Order>>(`/app/m4/order/${action}`, {
    method: 'POST',
    body: JSON.stringify({ orderNo }),
  })
}

export function payOrder(orderNo: string): Promise<Envelope<Order>> {
  return orderAction('pay', orderNo)
}

export function cancelOrder(orderNo: string): Promise<Envelope<Order>> {
  return orderAction('cancel', orderNo)
}

export function refundOrder(orderNo: string): Promise<Envelope<Order>> {
  return orderAction('refund', orderNo)
}
