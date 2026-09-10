/** 与后端 Pydantic 模型对应的公共类型（一期前端 Mock） */

export type ImageSize =
  | 'square_hd'
  | 'square'
  | 'portrait_4_3'
  | 'portrait_16_9'
  | 'landscape_4_3'
  | 'landscape_16_9'

export interface Sku {
  id: string
  name: string
  price: number
  stock: number
}

export interface Review {
  id: string
  user: string
  avatar: string
  rating: number
  content: string
  date: string
  reply?: string
  images?: string[]
}

export interface Artisan {
  name: string
  title: string
  avatar: string
  story: string
}

export type ProductModule = 'GOODS' | 'SPECIALTY'

export interface Product {
  id: string
  module: ProductModule
  title: string
  subtitle: string
  category: string
  price: number
  marketPrice?: number
  sales: number
  rating: number
  stock: number
  cover: string
  images: string[]
  skus: Sku[]
  /** 非遗工艺介绍（衣模块） */
  craft?: string
  artisan?: Artisan
  /** 农产品溯源（食模块特产） */
  origin?: string
  shelfLife?: string
  detail: string
  reviews: Review[]
}

export interface Dish {
  id: string
  name: string
  price: number
  img: string
  signature?: boolean
}

export interface TimeSlot {
  id: string
  name: string
  capacity: number
  left: number
}

export interface Restaurant {
  id: string
  name: string
  cover: string
  images: string[]
  rating: number
  pricePerCapita: number
  address: string
  hours: string
  capacity: number
  tags: string[]
  intro: string
  dishes: Dish[]
  slots: TimeSlot[]
  reviews: Review[]
}

export interface RoomType {
  id: string
  name: string
  bed: string
  area: number
  maxGuests: number
  price: number
  stock: number
  cover: string
  facilities: string[]
}

export interface Homestay {
  id: string
  name: string
  cover: string
  images: string[]
  rating: number
  score: { hygiene: number; location: number; service: number }
  tags: string[]
  facilities: string[]
  address: string
  intro: string
  notice: string
  rooms: RoomType[]
  reviews: Review[]
}

export interface Ticket {
  id: string
  name: string
  price: number
  stock: number
  note: string
}

export interface Scenic {
  id: string
  name: string
  cover: string
  openTime: string
  address: string
  intro: string
  rating: number
  tickets: Ticket[]
}

export interface RouteDay {
  day: number
  title: string
  desc: string
  meals: string
  stay: string
}

export interface TravelRoute {
  id: string
  title: string
  cover: string
  days: number
  theme: string
  price: number
  sales: number
  rating: number
  departure: string
  includes: string[]
  notice: string[]
  schedule: RouteDay[]
}

export interface PostAuthor {
  id: string
  name: string
  avatar: string
  bio?: string
}

export interface PostComment {
  id: string
  user: string
  avatar: string
  content: string
  date: string
  replies?: { user: string; content: string; date: string }[]
}

export interface Post {
  id: string
  title: string
  content: string
  images: string[]
  author: PostAuthor
  topic?: string
  place?: string
  likes: number
  collects: number
  views: number
  date: string
  liked?: boolean
  comments: PostComment[]
}

export interface CartItem {
  id: string
  productId: string
  title: string
  cover: string
  sku: string
  price: number
  qty: number
  stock: number
  shop: string
  checked: boolean
}

export type OrderType = 'GOODS' | 'SPECIALTY' | 'MEAL' | 'LODGING' | 'TICKET' | 'ROUTE'

export type OrderStatus =
  | 'UNPAID'
  | 'PAID'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'

export interface Order {
  orderNo: string
  type: OrderType
  status: OrderStatus
  title: string
  cover: string
  summary: string
  amount: number
  qty: number
  date: string
  shop: string
}

export interface Message {
  id: string
  type: 'SYSTEM' | 'ORDER' | 'INTERACT'
  title: string
  content: string
  date: string
  read: boolean
}

export interface Address {
  id: string
  name: string
  phone: string
  region: string
  detail: string
  isDefault: boolean
}

export interface Banner {
  id: string
  title: string
  subtitle: string
  image: string
  link: string
}

export interface LiveWeather {
  /** 天气文本，如 多云 / 晴 */
  text: string
  /** 当前温度（℃） */
  temp: number
  high: number
  low: number
}

export interface LiveInfo {
  /** 海拔高度（米） */
  altitude: number
  weather: LiveWeather
  /** 今日实时在园/到访游客数 */
  visitorsToday: number
  /** 苗年节倒计时 */
  festival: { name: string; date: string; daysLeft: number }
}

export interface UserProfile {
  id: string
  name: string
  phone: string
  avatar: string
  bio: string
  favorites: string[]
  /** 是否已设置登录密码（未设置时个人中心显示「设置密码」） */
  hasPassword?: boolean
}
