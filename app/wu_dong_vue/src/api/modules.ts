/** API 模块：每个函数对应一个后端接口（Mock 实现） */
import type {
  Address,
  CartItem,
  CommentItem,
  Homestay,
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
export const searchAll = S.searchAll

/* 认证 */
export const sendSmsCode = S.sendSmsCode
export const login = S.login
export const register = S.register
export const fetchMe = S.fetchMe
export const logout = S.logout
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
export const updateProfile = S.updateProfile
