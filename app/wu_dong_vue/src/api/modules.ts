/** API 模块：每个函数对应一个后端接口（Mock 实现） */
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
export const updateProfile = S.updateProfile
