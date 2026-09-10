/**
 * 真实订单/预订接口（对接 wu_dong_midway，前缀经 /api 代理到 6666）
 *
 * - 餐位预订走 m2 自建入口，建单即 CONFIRMED（无需支付）
 * - 民宿预订走 m3 自建入口，建单 UNPAID 并预占房态，再经通用 pay 模拟支付
 * - 通用订单查询/支付/取消在 order 模块；住宿取消需回补房态，走 m3 入口
 * - createOrder（购物车/门票路线结算）仍保留在 m4-order.ts，不在本文件
 */
import type { Order, OrderStatus, OrderType } from '@/types'
import type { Envelope } from './contracts'
import { ApiError } from './contracts'
import { apiFetch } from './http'

/** 后端订单实体（camelCase），仅取前端需要的列 */
interface OrderEntity {
  orderNo: string
  type: OrderType
  status: OrderStatus
  title: string
  cover: string
  summary: string
  amount: number | string
  qty: number | string
  shopName: string
  createdAt: string
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 后端时间 → 前端展示用 'YYYY-MM-DD'（按本地时区，避免 UTC 切片错位） */
function toDateStr(s: string): string {
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return String(s).slice(0, 10)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 订单实体 → 前端 Order（shopName→shop，createdAt→date，金额/数量转 number） */
export function toOrder(e: OrderEntity): Order {
  return {
    orderNo: e.orderNo,
    type: e.type,
    status: e.status,
    title: e.title,
    cover: e.cover,
    summary: e.summary,
    amount: Number(e.amount) || 0,
    qty: Number(e.qty) || 1,
    shop: e.shopName ?? '',
    date: toDateStr(e.createdAt),
  }
}

/** 我的订单：?type=&status= 可选 */
export async function getOrders(
  filter?: { type?: OrderType | 'ALL'; status?: OrderStatus | 'ALL' },
): Promise<Envelope<Order[]>> {
  const params = new URLSearchParams()
  if (filter?.type && filter.type !== 'ALL') params.set('type', filter.type)
  if (filter?.status && filter.status !== 'ALL') params.set('status', filter.status)
  const query = params.toString()
  const res = await apiFetch<Envelope<OrderEntity[]>>(
    `/app/order/list${query ? `?${query}` : ''}`,
  )
  return { ...res, data: (res.data || []).map(toOrder) }
}

/** 订单详情（主表 + 支付记录） */
export async function getOrderDetail(orderNo: string): Promise<Envelope<Order>> {
  const res = await apiFetch<Envelope<OrderEntity>>(
    `/app/order/detail/${encodeURIComponent(orderNo)}`,
  )
  return { ...res, data: toOrder(res.data) }
}

/** 模拟支付：不接真实支付 API，后端落一条 mock SUCCESS 支付记录并置 PAID（幂等） */
export async function payOrder(orderNo: string): Promise<Envelope<Order>> {
  const res = await apiFetch<Envelope<OrderEntity>>('/app/order/pay', {
    method: 'POST',
    body: JSON.stringify({ orderNo }),
  })
  return { ...res, data: toOrder(res.data) }
}

/**
 * 取消订单：住宿单走 m3 入口（同事务回补房态），其余走通用订单入口。
 */
export async function cancelOrder(
  orderNo: string,
  type?: OrderType,
): Promise<Envelope<Order>> {
  const path =
    type === 'LODGING' ? '/app/m3/booking/cancel' : '/app/order/cancel'
  const res = await apiFetch<Envelope<OrderEntity>>(path, {
    method: 'POST',
    body: JSON.stringify({ orderNo }),
  })
  return { ...res, data: toOrder(res.data) }
}

/** 退款本期未接入（无真实支付通道），给前端明确提示 */
export async function refundOrder(): Promise<Envelope<Order>> {
  throw new ApiError(3003, '暂不支持线上退款，请联系客服')
}

/** 餐位预订入参（m2_order_ext） */
export interface MealBookingPayload {
  restaurantId: string
  slotId: string
  diningDate: string
  guests: number
  contactName: string
  contactPhone: string
}

/** 餐位预订：建单即 CONFIRMED，返回订单（前端跳预订成功页） */
export async function createMealBooking(
  p: MealBookingPayload,
): Promise<Envelope<Order>> {
  const res = await apiFetch<Envelope<OrderEntity>>('/app/m2/booking/create', {
    method: 'POST',
    body: JSON.stringify(p),
  })
  return { ...res, data: toOrder(res.data) }
}

/** 民宿预订入参（m3_order_ext），金额由服务端按日历重算 */
export interface LodgingBookingPayload {
  homestayId: string
  roomTypeId: string
  checkInDate: string
  checkOutDate: string
  guests: number
  contactName: string
  contactPhone: string
}

/** 民宿预订：建单 UNPAID 并预占房态，返回订单（前端跳模拟收银台） */
export async function createLodgingBooking(
  p: LodgingBookingPayload,
): Promise<Envelope<Order>> {
  const res = await apiFetch<Envelope<OrderEntity>>('/app/m3/booking/create', {
    method: 'POST',
    body: JSON.stringify(p),
  })
  return { ...res, data: toOrder(res.data) }
}