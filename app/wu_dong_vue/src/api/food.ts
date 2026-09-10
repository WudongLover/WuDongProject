/**
 * 【m2-食模块】真实 API 层
 * 对接后端 /api/v1/m2/restaurant 和 /api/v1/m2/specialty
 * 返回格式与 mock 保持一致：{ code, message, data }
 */
import http from './http'
import type { Product, Restaurant } from '@/types'

// ==================== 餐厅 ====================

/** 后端实体 → 前端 Restaurant 类型 */
function toRestaurant(entity: any): Restaurant {
  return {
    id: String(entity.id),
    name: entity.name || '',
    cover: entity.cover || '',
    images: entity.images || [],
    rating: Number(entity.rating) || 5,
    pricePerCapita: Number(entity.pricePerCapita) || 0,
    address: entity.address || '',
    hours: entity.hours || '',
    capacity: entity.capacity || 0,
    tags: entity.tags || [],
    intro: entity.intro || '',
    dishes: [],
    slots: [],
    reviews: [],
  }
}

/** 餐厅列表 */
export async function getRestaurants() {
  const res = await http.get('/v1/m2/restaurant/page', {
    params: { page: 1, pageSize: 100 },
  })
  const list = (res.data.list || []).map(toRestaurant)
  return { code: 0, message: 'ok', data: list }
}

/** 餐厅详情 */
export async function getRestaurantDetail(id: string) {
  const res = await http.get(`/v1/m2/restaurant/info/${id}`)
  return { code: 0, message: 'ok', data: toRestaurant(res.data) }
}

// ==================== 特产 ====================

/** 后端实体 → 前端 Product 类型 */
function toProduct(entity: any): Product {
  return {
    id: String(entity.id),
    module: 'SPECIALTY',
    title: entity.title || '',
    subtitle: entity.subtitle || '',
    category: entity.category || '',
    price: Number(entity.price) || 0,
    marketPrice: entity.marketPrice != null ? Number(entity.marketPrice) : undefined,
    sales: Number(entity.sales) || 0,
    rating: Number(entity.rating) || 5,
    stock: Number(entity.stock) || 0,
    cover: entity.cover || '',
    images: entity.images || [],
    skus: [],
    craft: entity.craft || undefined,
    artisan: entity.artisan || undefined,
    origin: entity.origin || undefined,
    shelfLife: entity.shelfLife || undefined,
    detail: entity.detail || '',
    reviews: [],
  }
}

/** 特产列表（分页） */
export async function getSpecialties() {
  const res = await http.get('/v1/m2/specialty/page', {
    params: { page: 1, pageSize: 100 },
  })
  const items = (res.data.list || []).map(toProduct)
  return { code: 0, message: 'ok', data: { items, total: res.data.total || 0 } }
}