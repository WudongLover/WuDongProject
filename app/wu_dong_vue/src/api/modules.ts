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

/* 社区 */
export const getPosts = S.getPosts
export const getPostDetail = S.getPostDetail
export const togglePostLike = S.togglePostLike
export const addComment = S.addComment

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
