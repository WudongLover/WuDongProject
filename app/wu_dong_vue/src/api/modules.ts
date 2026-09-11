/** API 模块：每个函数对应一个后端接口或本地尚未迁移的能力 */
import type {
  Homestay,
  Post,
  PostComment,
  Product,
  ProductModule,
  Restaurant,
  Scenic,
  TravelRoute,
} from '@/types'
import * as S from '@/mock/server'
import type { Envelope } from '@/mock/server'
import { apiFetch } from './http'

/* 首页 */
export const getHomeData = S.getHomeData
export const getLiveInfo = S.getLiveInfo
export const searchAll = S.searchAll

/* 文化导览：前端固定内容，不计划迁后端；页面仍统一从 @/api 取，守住"页面不直接访问 mock" */
export {
  cultureSections,
  cultureEntries,
  getCultureSection,
  findCultureStory,
  relatedCultureStories,
} from '@/mock/culture'

/* 认证 */
export {
  sendSmsCode,
  login,
  register,
  fetchMe,
  logout,
  updateProfile,
  setPassword,
  getUserStats,
  refreshAccess as bootstrap,
} from './auth'

/* 商品（衣 / 特产）：真实后端 m1-goods，路由前缀 /api/v1/m1 */
export interface GoodsQuery {
  module?: ProductModule
  /** 类目 id（后端主键），由 getCategories 提供；不传即全部类目 */
  category_id?: string
  keyword?: string
  sort?: 'default' | 'sales' | 'price-asc' | 'price-desc' | 'rating'
  max_price?: number
  page?: number
  page_size?: number
}

export interface GoodsPage {
  items: Product[]
  page: number
  page_size: number
  total: number
}

export interface Category {
  id: string
  module: ProductModule
  name: string
}

export function getGoodsList(query: GoodsQuery = {}): Promise<Envelope<GoodsPage>> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return apiFetch<Envelope<GoodsPage>>(`/v1/m1/products${qs ? `?${qs}` : ''}`)
}

export function getProductDetail(id: string): Promise<Envelope<Product>> {
  return apiFetch<Envelope<Product>>(`/v1/m1/products/${id}`)
}

/** 商品类目列表，供筛选栏把类目名换成 id 传给后端 */
export function getCategories(module?: ProductModule): Promise<Envelope<Category[]>> {
  return apiFetch<Envelope<Category[]>>(`/v1/m1/categories${module ? `?module=${module}` : ''}`)
}

/* 食（真实后端 m2：列表/详情含菜品与时段） */
export { getRestaurants, getRestaurantDetail } from './food'

/* 住 */
export async function getHomestays() {
  return apiFetch<Envelope<Homestay[]>>('/app/m3/homestay')
}

export async function getHomestayDetail(id: string) {
  return apiFetch<Envelope<Homestay>>(`/app/m3/homestay/detail/${id}`)
}

export async function getRoomCalendar(roomTypeId: string | number) {
  return apiFetch<Envelope<any>>(`/app/m3/homestay/room-calendar/${roomTypeId}`)
}

/* 行：门票、景区和路线均使用真实后端接口 */
export * from './m4'
export * from './m4-order'
/* 通用订单 + 餐位/民宿预订（真实后端 order / m2 / m3） */
export * from './order'

/* 社区（真实后端 http://127.0.0.1:8001，vite 代理 /api） */

export function getPosts(topic?: string, sort?: 'hot' | 'new'): Promise<Envelope<Post[]>> {
  const params = new URLSearchParams()
  if (topic) params.set('topic', topic)
  if (sort) params.set('sort', sort)
  const qs = params.toString()
  return apiFetch<Envelope<Post[]>>(`/posts${qs ? `?${qs}` : ''}`)
}
export function getPostDetail(id: string): Promise<Envelope<Post>> {
  return apiFetch<Envelope<Post>>(`/posts/${id}`)
}
/** 点赞切换：PUT（幂等） */
export function togglePostLike(id: string): Promise<Envelope<{ liked: boolean; likes: number }>> {
  return apiFetch<Envelope<{ liked: boolean; likes: number }>>(`/posts/${id}/like`, { method: 'PUT' })
}
/** 获取帖子评论列表 */
export function getComments(postId: string): Promise<Envelope<PostComment[]>> {
  return apiFetch<Envelope<PostComment[]>>(`/posts/${postId}/comments`)
}
/** 新增评论（支持回复 parentCommentId） */
export function addComment(postId: string, content: string, parentCommentId?: string): Promise<Envelope<PostComment[]>> {
  return apiFetch<Envelope<PostComment[]>>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, parentId: parentCommentId ? Number(parentCommentId) : undefined }),
  })
}

/** 发布游记 */
export function publishPost(data: { title: string; content: string; topic?: string; place?: string }): Promise<Envelope<Post>> {
  return apiFetch<Envelope<Post>>('/posts', { method: 'POST', body: JSON.stringify(data) })
}

/** 逻辑删除帖子 */
export function deletePost(postId: string): Promise<Envelope<boolean>> {
  return apiFetch<Envelope<boolean>>(`/posts/${postId}`, { method: 'DELETE' })
}

/** 逻辑删除评论 */
export function deleteComment(postId: string, commentId: string): Promise<Envelope<boolean>> {
  return apiFetch<Envelope<boolean>>(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' })
}

/* 收藏 */
export function toggleFavorite(targetType: string, targetId: string | number): Promise<Envelope<{ favorited: boolean }>> {
  return apiFetch<Envelope<{ favorited: boolean }>>('/favorites', {
    method: 'PUT',
    body: JSON.stringify({ targetType, targetId: Number(targetId) }),
  })
}

export function getFavorites(): Promise<Envelope<{ id: string; targetType: string; name: string; cover: string; type: string; price?: number; targetId: string }[]>> {
  return apiFetch('/favorites')
}

export function checkFavorite(targetType: string, targetId: string | number): Promise<Envelope<{ favorited: boolean }>> {
  return apiFetch<Envelope<{ favorited: boolean }>>(`/favorites/${targetType}/${targetId}`)
}

/* 购物车：真实后端 /api/cart，见 @/api/cart（页面通过 stores/cart 调用） */
export { cartApi } from './cart'

/* 消息 / 地址 / 资料 */
export { messageApi } from './message'
export { addressApi } from './address'
