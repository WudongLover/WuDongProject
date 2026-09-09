/**
 * API 模块：认证与个人资料走真实后端（/app/user/auth/*），
 * 其余业务数据暂由本地 Mock 提供。
 */
import type {
  Address,
  CartItem,
  CommentItem,
  Homestay,
  LiveInfo,
  Message,
  Order,
  OrderStatus,
  OrderType,
  Post,
  PostComment,
  Product,
  Restaurant,
  Scenic,
  TravelRoute,
  UserProfile,
} from '@/types'
import * as S from '@/mock/server'

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

/* 商品（衣 / 特产） */
export const getGoodsList = S.getGoodsList
export const getProductDetail = S.getProductDetail

/* 食 */
export const getRestaurants = S.getRestaurants
export const getRestaurantDetail = S.getRestaurantDetail

/* 住 */
export const getHomestays = S.getHomestays
export const getHomestayDetail = S.getHomestayDetail
export const getRoomCalendar = S.getRoomCalendar

/* 行 */
export const getTrips = S.getTrips
export const getRouteDetail = S.getRouteDetail

/* 社区（真实后端 http://127.0.0.1:8001，vite 代理 /api） */
import { apiFetch } from './http'
import type { Envelope } from '@/mock/server'

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

/* 订单 */
export const createOrder = S.createOrder
export const payOrder = S.payOrder
export const cancelOrder = S.cancelOrder
export const refundOrder = S.refundOrder
export const getOrders = S.getOrders
export type CreateOrderPayload = S.CreateOrderPayload

/* 消息 / 地址 / 资料 */
export const getMessages = S.getMessages
export const markMessageRead = S.markMessageRead
export const markAllMessagesRead = S.markAllMessagesRead
export const getAddresses = S.getAddresses
