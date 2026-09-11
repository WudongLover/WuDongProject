import type { Order, OrderType } from '@/types'
import type { Envelope } from './contracts'
import { apiFetch } from './http'

/**
 * 下单入参。
 * 餐位、民宿预订已改为各自模块入口（见 order.ts 的 createMealBooking / createLodgingBooking），
 * 本函数负责实物商品（购物车结算 / 立即购买）与门票/路线下单，
 * 统一走公共订单入口 /api/app/order/create。
 *
 * 金额、标题、摘要、店铺名以服务端重算为准：展示字段仅为类型完整保留，传入会被忽略。
 * - 购物车结算：传 cartItemIds
 * - 立即购买：传 items（商品 + 规格 + 数量，不经过购物车）
 * - 门票/路线：传 ticketId / routeId + 出游信息
 */
export interface CreateOrderPayload {
  type: OrderType
  title?: string
  cover?: string
  summary?: string
  amount?: number
  qty?: number
  shop?: string
  cartItemIds?: string[]
  /** 立即购买：不走购物车，服务端按实时价格算价并扣库存 */
  items?: { productId: string; skuId?: string; qty: number }[]
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
  return apiFetch<Envelope<Order>>('/app/order/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
