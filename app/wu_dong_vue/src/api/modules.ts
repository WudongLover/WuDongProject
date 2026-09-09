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
  UserProfile,
} from '@/types'
import * as S from '@/mock/server'
import type { Envelope } from '@/mock/server'
import { apiFetch } from './http'

/* 首页 */
export const getHomeData = S.getHomeData
export const getLiveInfo = S.getLiveInfo
export const searchAll = S.searchAll

/* 认证 */
export {
  sendSmsCode,
  login,
  register,
  fetchMe,
  logout,
  updateProfile,
  refreshAccess as bootstrap,
} from './auth'
export const currentUser = S.currentUser

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

/* 食 */
export const getRestaurants = S.getRestaurants
export const getRestaurantDetail = S.getRestaurantDetail

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

/* 社区（真实后端 http://127.0.0.1:8001，vite 代理 /api） */

export function getPosts(): Promise<Envelope<Post[]>> {
  return apiFetch<Envelope<Post[]>>('/posts')
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
/** 新增评论 */
export function addComment(postId: string, content: string): Promise<Envelope<PostComment[]>> {
  return apiFetch<Envelope<PostComment[]>>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
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
export const getFavorites = S.getFavorites
export const toggleFavorite = S.toggleFavorite
export const isFavorite = S.isFavorite

/* 购物车 */
export const getCart = S.getCart
export const addToCart = S.addToCart
export const updateCartItem = S.updateCartItem
export const removeCartItem = S.removeCartItem
export const checkCart = S.checkCart

/* 消息 / 地址 / 资料 */
export const getMessages = S.getMessages
export const markMessageRead = S.markMessageRead
export const markAllMessagesRead = S.markAllMessagesRead
export const getAddresses = S.getAddresses
