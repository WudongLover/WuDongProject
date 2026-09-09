import type { Scenic, TravelRoute } from '@/types'
import type { Envelope, PageResult } from './contracts'
import { apiFetch } from './http'

export interface TripsResponse {
  scenics: Scenic[]
  routes: TravelRoute[]
}

function normalizeRoute(route: Record<string, any>): TravelRoute {
  return {
    ...route,
    id: String(route.id),
    price: Number(route.price),
    rating: Number(route.rating),
    includes: Array.isArray(route.includes) ? route.includes : [],
    notice: Array.isArray(route.notice) ? route.notice : [],
    schedule: Array.isArray(route.schedule) ? route.schedule : [],
  } as TravelRoute
}

function normalizeScenic(scenic: Record<string, any>): Scenic {
  return {
    ...scenic,
    id: String(scenic.id),
    rating: Number(scenic.rating),
    tickets: Array.isArray(scenic.tickets)
      ? scenic.tickets.map((ticket: Record<string, any>) => ({
          ...ticket,
          id: String(ticket.id),
          price: Number(ticket.price),
        }))
      : [],
  } as Scenic
}

export async function getTrips(): Promise<Envelope<TripsResponse>> {
  const [scenicResponse, routeResponse] = await Promise.all([
    apiFetch<Envelope<Scenic[]>>('/app/m4/scenic/list'),
    apiFetch<Envelope<PageResult<Record<string, unknown>>>>('/app/m4/route/list?page=1&size=100&status=ON_SHELF'),
  ])
  return {
    code: 0,
    message: 'ok',
    data: {
      scenics: scenicResponse.data.map((scenic) => normalizeScenic(scenic as Record<string, any>)),
      routes: routeResponse.data.list.map(normalizeRoute),
    },
  }
}

export interface TicketQuery {
  page?: number
  size?: number
  keyword?: string
  scenicId?: string | number
}

export interface TicketPayload {
  scenicId: number
  name: string
  price: number | string
  stock?: number
  note?: string
}

export function getTicketPage(query: TicketQuery = {}): Promise<Envelope<PageResult<Record<string, unknown>>>> {
  const params = new URLSearchParams({ page: String(query.page ?? 1), size: String(query.size ?? 10) })
  if (query.keyword) params.set('keyword', query.keyword)
  if (query.scenicId !== undefined) params.set('scenicId', String(query.scenicId))
  return apiFetch<Envelope<PageResult<Record<string, unknown>>>>(`/app/m4/ticket/page?${params}`)
}

export function getTicketInfo(id: string | number): Promise<Envelope<Record<string, unknown>>> {
  return apiFetch<Envelope<Record<string, unknown>>>(`/app/m4/ticket/info?id=${encodeURIComponent(id)}`)
}

export function addTicket(payload: TicketPayload): Promise<Envelope<Record<string, unknown>>> {
  return apiFetch<Envelope<Record<string, unknown>>>('/app/m4/ticket/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteTicket(id: string | number): Promise<Envelope<boolean>> {
  return apiFetch<Envelope<boolean>>('/app/m4/ticket/delete', {
    method: 'POST',
    body: JSON.stringify({ id }),
  })
}

export interface RouteQuery {
  page?: number
  size?: number
  keyword?: string
  theme?: string
  days?: number
  status?: string
  merchantId?: string | number
}

export interface RoutePayload {
  merchantId?: number
  title: string
  cover: string
  days?: number
  theme?: string
  price: number | string
  sales?: number
  rating?: number | string
  departure?: string
  includes?: string[]
  notice?: string[]
  status?: string
}

export async function getRoutePage(query: RouteQuery = {}): Promise<Envelope<PageResult<TravelRoute>>> {
  const params = new URLSearchParams({ page: String(query.page ?? 1), size: String(query.size ?? 10) })
  if (query.keyword) params.set('keyword', query.keyword)
  if (query.theme) params.set('theme', query.theme)
  if (query.days !== undefined) params.set('days', String(query.days))
  if (query.status) params.set('status', query.status)
  if (query.merchantId !== undefined) params.set('merchantId', String(query.merchantId))
  const response = await apiFetch<Envelope<PageResult<Record<string, unknown>>>>(`/app/m4/route/page?${params}`)
  return { ...response, data: { ...response.data, list: response.data.list.map(normalizeRoute) } }
}

export async function getRouteDetail(id: string): Promise<Envelope<TravelRoute>> {
  const response = await apiFetch<Envelope<Record<string, any>>>(`/app/m4/route/info?id=${encodeURIComponent(id)}`)
  return { ...response, data: normalizeRoute(response.data) }
}

export function addRoute(payload: RoutePayload): Promise<Envelope<Record<string, unknown>>> {
  return apiFetch<Envelope<Record<string, unknown>>>('/app/m4/route/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteRoute(id: string | number): Promise<Envelope<boolean>> {
  return apiFetch<Envelope<boolean>>('/app/m4/route/delete', {
    method: 'POST',
    body: JSON.stringify({ id }),
  })
}
