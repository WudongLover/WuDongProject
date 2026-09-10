/**
 * 【m2-食模块】真实 API 层
 * - 餐厅：后端 /api/v1/m2/restaurant（表 wudong_m2_restaurant）
 * - 特产：复用 m1 商品接口（表 wudong_m1_product，module=SPECIALTY），后端无独立 m2 特产表
 *
 * 统一走 apiFetch：注入 x-user-id、解包 { code, message, data } 信封、
 * 并把响应里的远程图片 URL 换成本地路径。
 */
import type { Product, Restaurant } from '@/types'
import type { Envelope } from './contracts'
import { apiFetch } from './http'

// ==================== 餐厅 ====================

/** m2 餐厅分页响应（对齐 restaurant_service.page 的返回结构） */
interface RestaurantPage {
  list: Record<string, any>[]
  total: number
}

/** m1 商品分页响应（对齐 m1 dto/result.ts 的 PageData） */
interface GoodsPage {
  items: Product[]
  total: number
}

/** 后端实体 → 前端 Restaurant 类型 */
function toRestaurant(entity: Record<string, any>): Restaurant {
  return {
    id: String(entity.id),
    name: entity.name || '',
    cover: entity.cover || '',
    images: entity.images || [],
    rating: Number(entity.rating) || 5,
    pricePerCapita: Number(entity.pricePerCapita) || 0,
    address: entity.address || '',
    hours: entity.hours || '',
    capacity: Number(entity.capacity) || 0,
    tags: entity.tags || [],
    intro: entity.intro || '',
    // 菜品 / 餐位 / 评价后端尚未开口，先留空（见 docx/TODO.md：餐位预订改为展示页）
    dishes: [],
    slots: [],
    reviews: [],
  }
}

/** 餐厅列表 */
export async function getRestaurants(): Promise<Envelope<Restaurant[]>> {
  const res = await apiFetch<Envelope<RestaurantPage>>(
    '/v1/m2/restaurant/page?page=1&pageSize=100',
  )
  return { ...res, data: (res.data?.list || []).map(toRestaurant) }
}

/** 餐厅详情 */
export async function getRestaurantDetail(id: string): Promise<Envelope<Restaurant>> {
  const res = await apiFetch<Envelope<Record<string, any>>>(
    `/v1/m2/restaurant/info/${id}`,
  )
  return { ...res, data: toRestaurant(res.data) }
}

// ==================== 特产 ====================

/**
 * 特产列表（分页）
 * 特产不是独立实体：m1 商品表用 module 区分「衣 GOODS / 特产 SPECIALTY」，
 * 且 m1 的 ProductVO 字段已逐一对齐前端 Product，无需再做一层字段映射。
 */
export async function getSpecialties(): Promise<Envelope<{ items: Product[]; total: number }>> {
  const res = await apiFetch<Envelope<GoodsPage>>(
    '/v1/m1/products?module=SPECIALTY&page=1&page_size=100',
  )
  return {
    ...res,
    data: { items: res.data?.items || [], total: res.data?.total || 0 },
  }
}
