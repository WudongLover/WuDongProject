/**
 * 【m2-食模块】真实 API 层
 * 对接后端 /api/v1/m2/restaurant （经 vite /api 代理到 6666）
 * 返回格式与 mock 保持一致：{ code, message, data }
 */
import type { Dish, Product, Restaurant, TimeSlot } from '@/types'
import type { Envelope } from './contracts'
import { apiFetch } from './http'

// ==================== 餐厅 ====================

/** 后端菜品 → 前端 Dish（signature 由后端 is_signature 转好，这里只兜底） */
function toDish(d: any): Dish {
  return {
    id: String(d.id),
    name: d.name || '',
    price: Number(d.price) || 0,
    img: d.img || '',
    signature: !!d.signature,
  }
}

/** 后端时段 → 前端 TimeSlot（余量降级：left 缺省取 capacity） */
function toSlot(s: any): TimeSlot {
  return {
    id: String(s.id),
    name: s.name || '',
    capacity: Number(s.capacity) || 0,
    left: Number(s.left ?? s.capacity) || 0,
  }
}

/** 后端实体 → 前端 Restaurant 类型；列表接口不带 dishes/slots，详情接口才带 */
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
    capacity: Number(entity.capacity) || 0,
    tags: entity.tags || [],
    intro: entity.intro || '',
    dishes: Array.isArray(entity.dishes) ? entity.dishes.map(toDish) : [],
    slots: Array.isArray(entity.slots) ? entity.slots.map(toSlot) : [],
    reviews: Array.isArray(entity.reviews) ? entity.reviews : [],
  }
}

/** 餐厅列表 */
export async function getRestaurants() {
  const res = await apiFetch<Envelope<{ list: any[]; total: number }>>(
    '/v1/m2/restaurant/page?page=1&pageSize=100',
  )
  const list = (res.data.list || []).map(toRestaurant)
  return { code: 0, message: 'ok', data: list }
}

/** 餐厅详情：含菜品与预订时段 */
export async function getRestaurantDetail(id: string) {
  const res = await apiFetch<Envelope<any>>(
    `/v1/m2/restaurant/info/${encodeURIComponent(id)}`,
  )
  return { code: 0, message: 'ok', data: toRestaurant(res.data) }
}

// ==================== 特产 ====================

/** categoryId → 分类名称映射（对齐 wudong_m1_category 表） */
const CATEGORY_MAP: Record<number, string> = {
  5: '茶叶',
  6: '腊肉',
  7: '米酒',
  8: '酸食',
  9: '其他',
}

/** 后端实体 → 前端 Product 类型 */
function toProduct(entity: any): Product {
  return {
    id: String(entity.id),
    module: 'SPECIALTY',
    title: entity.title || '',
    subtitle: entity.subtitle || '',
    category: CATEGORY_MAP[entity.categoryId] || '',
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
  const res = await apiFetch<Envelope<{ list: any[]; total: number }>>(
    '/v1/m2/specialty/page?page=1&pageSize=100',
  )
  const items = (res.data.list || []).map(toProduct)
  return { code: 0, message: 'ok', data: { items, total: res.data.total || 0 } }
}