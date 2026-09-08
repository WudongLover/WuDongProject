/**
 * Mock 服务层：模拟后端统一响应体 { code, message, data } 与网络延迟。
 * 后端 FastAPI 就绪后，仅需将 src/api 中的实现切换为 axios 调用。
 */
import type {
  Address,
  CartItem,
  Message,
  Order,
  OrderStatus,
  OrderType,
  Post,
  Product,
  UserProfile,
} from '@/types'
import {
  banners,
  announcements,
  goods,
  specialties,
  restaurants,
  homestays,
  scenics,
  routes,
  posts,
  initialCart,
  initialOrders,
  initialMessages,
  initialAddresses,
  defaultUser,
  hotKeywords,
} from './data'

export interface Envelope<T> {
  code: number
  message: string
  data: T
}

const delay = (ms = 260) => new Promise((r) => setTimeout(r, ms))

function ok<T>(data: T, message = 'ok'): Envelope<T> {
  return { code: 0, message, data }
}

export class ApiError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

/* ---------- 内存态（模拟数据库会话） ---------- */

const db = {
  user: null as UserProfile | null,
  cart: [...initialCart] as CartItem[],
  orders: [...initialOrders] as Order[],
  messages: [...initialMessages] as Message[],
  addresses: [...initialAddresses] as Address[],
  favorites: new Set(defaultUser.favorites),
  likedPosts: new Set<string>(),
  smsCode: '123456' as string, // 对齐后端 Mock：验证码固定 123456
  seq: 100,
}

function nextOrderNo(): string {
  db.seq += 1
  const d = new Date()
  const ymd = `${d.getFullYear()}`.slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0')
  return `WD${ymd}${String(db.seq).padStart(4, '0')}`
}

export const today = new Date()
export function fmtDate(offsetDays: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ---------- 通用查询 ---------- */

export async function getHomeData() {
  await delay(320)
  return ok({
    banners,
    announcements,
    recommends: {
      goods: goods.slice(0, 4),
      restaurants: restaurants.slice(0, 3),
      homestays: homestays.slice(0, 3),
      routes: routes.slice(0, 3),
      posts: posts.slice(0, 6),
    },
    hotKeywords,
  })
}

export async function searchAll(keyword: string) {
  await delay(300)
  const kw = keyword.trim()
  const match = (s: string) => s.toLowerCase().includes(kw.toLowerCase())
  return ok({
    goods: [...goods, ...specialties].filter((g) => match(g.title) || match(g.subtitle) || match(g.category)),
    restaurants: restaurants.filter((r) => match(r.name) || match(r.tags.join(''))),
    homestays: homestays.filter((h) => match(h.name) || match(h.tags.join(''))),
    routes: routes.filter((r) => match(r.title) || match(r.theme)),
    posts: posts.filter((p) => match(p.title) || match(p.content) || match(p.topic || '')),
  })
}

/* ---------- 认证 ---------- */

export async function sendSmsCode(phone: string) {
  await delay(600)
  if (!/^1\d{10}$/.test(phone)) throw new ApiError(1004, '请输入正确的手机号')
  return ok({ sent: true, hint: '验证码已发送（Mock 固定为 123456）' })
}

export async function login(payload: { phone: string; password?: string; smsCode?: string }) {
  await delay(500)
  if (!/^1\d{10}$/.test(payload.phone)) throw new ApiError(1004, '请输入正确的手机号')
  if (payload.smsCode != null && payload.smsCode !== db.smsCode) throw new ApiError(2001, '验证码错误')
  if (payload.password != null && payload.password.length < 6) throw new ApiError(2003, '密码错误')
  db.user = { ...defaultUser }
  return ok({
    token: 'mock-access-token-' + Date.now(),
    user: db.user,
  })
}

export async function register(payload: { phone: string; smsCode: string; password: string; name: string }) {
  await delay(500)
  if (!/^1\d{10}$/.test(payload.phone)) throw new ApiError(1004, '请输入正确的手机号')
  if (payload.smsCode !== db.smsCode) throw new ApiError(2001, '验证码错误')
  if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,20}$/.test(payload.password))
    throw new ApiError(1004, '密码需 8-20 位，且同时包含字母与数字')
  db.user = { ...defaultUser, name: payload.name || '乌东新客' }
  return ok({ token: 'mock-access-token-' + Date.now(), user: db.user })
}

export async function fetchMe() {
  await delay(120)
  if (!db.user) throw new ApiError(1001, '未登录')
  return ok(db.user)
}

export function currentUser(): UserProfile | null {
  return db.user
}

export function logout() {
  db.user = null
}

/* ---------- 商品（衣 + 特产） ---------- */

export interface GoodsFilter {
  category?: string
  module?: 'GOODS' | 'SPECIALTY'
  keyword?: string
  sort?: 'default' | 'sales' | 'price-asc' | 'price-desc' | 'rating'
  maxPrice?: number
}

export async function getGoodsList(filter: GoodsFilter = {}) {
  await delay(280)
  let list = filter.module === 'SPECIALTY' ? [...specialties] : [...goods, ...specialties]
  if (filter.module === 'GOODS') list = [...goods]
  if (filter.category && filter.category !== '全部') list = list.filter((g) => g.category === filter.category)
  if (filter.keyword) list = list.filter((g) => (g.title + g.subtitle).includes(filter.keyword!))
  if (filter.maxPrice) list = list.filter((g) => g.price <= filter.maxPrice!)
  switch (filter.sort) {
    case 'sales':
      list.sort((a, b) => b.sales - a.sales)
      break
    case 'price-asc':
      list.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      list.sort((a, b) => b.price - a.price)
      break
    case 'rating':
      list.sort((a, b) => b.rating - a.rating)
      break
  }
  return ok({ items: list, total: list.length })
}

export async function getProductDetail(id: string) {
  await delay(240)
  const found = [...goods, ...specialties].find((g) => g.id === id)
  if (!found) throw new ApiError(1003, '资源不存在')
  return ok(found)
}

/* ---------- 食 ---------- */

export async function getRestaurants() {
  await delay(280)
  return ok(restaurants)
}

export async function getRestaurantDetail(id: string) {
  await delay(240)
  const r = restaurants.find((x) => x.id === id)
  if (!r) throw new ApiError(1003, '资源不存在')
  return ok(r)
}

/* ---------- 住 ---------- */

export async function getHomestays() {
  await delay(280)
  return ok(homestays)
}

export async function getHomestayDetail(id: string) {
  await delay(240)
  const h = homestays.find((x) => x.id === id)
  if (!h) throw new ApiError(1003, '资源不存在')
  return ok(h)
}

/** 未来 30 天房态（Mock：周末库存减半） */
export async function getRoomCalendar(roomId: string) {
  await delay(160)
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const weekend = date.getDay() === 0 || date.getDay() === 6
    return {
      date: fmtDate(i),
      stock: weekend ? 1 : 2 + (i % 3),
      priceDelta: weekend ? 60 : 0,
    }
  })
  return ok(days)
}

/* ---------- 行 ---------- */

export async function getTrips() {
  await delay(280)
  return ok({ scenics, routes })
}

export async function getRouteDetail(id: string) {
  await delay(240)
  const r = routes.find((x) => x.id === id)
  if (!r) throw new ApiError(1003, '资源不存在')
  return ok(r)
}

/* ---------- 社区 ---------- */

export async function getPosts() {
  await delay(300)
  return ok(posts)
}

export async function getPostDetail(id: string) {
  await delay(240)
  const p = posts.find((x) => x.id === id)
  if (!p) throw new ApiError(1003, '资源不存在')
  return ok(p)
}

export async function togglePostLike(id: string) {
  await delay(120)
  if (db.likedPosts.has(id)) db.likedPosts.delete(id)
  else db.likedPosts.add(id)
  const p = posts.find((x) => x.id === id)
  if (!p) throw new ApiError(1003, '资源不存在')
  p.liked = db.likedPosts.has(id)
  p.likes += p.liked ? 1 : -1
  return ok({ liked: p.liked, likes: p.likes })
}

export async function addComment(postId: string, content: string) {
  await delay(200)
  if (!content.trim()) throw new ApiError(1004, '评论内容不能为空')
  const p = posts.find((x) => x.id === postId)
  if (!p) throw new ApiError(1003, '资源不存在')
  const user = db.user
  p.comments.push({
    id: 'c' + Date.now(),
    user: user?.name || '游客',
    avatar: user?.avatar || '',
    content: content.trim(),
    date: fmtDate(0),
  })
  return ok(p.comments)
}

/* ---------- 收藏 ---------- */

export async function getFavorites() {
  await delay(200)
  const favs: { product?: Product; name: string; id: string; cover: string; type: string; price?: number }[] = []
  for (const id of db.favorites) {
    const g = [...goods, ...specialties].find((x) => x.id === id)
    if (g) {
      favs.push({ product: g, id: g.id, name: g.title, cover: g.cover, type: g.module === 'GOODS' ? '非遗商品' : '特产', price: g.price })
      continue
    }
    const h = homestays.find((x) => x.id === id)
    if (h) {
      favs.push({ id: h.id, name: h.name, cover: h.cover, type: '民宿' })
      continue
    }
    const r = restaurants.find((x) => x.id === id)
    if (r) {
      favs.push({ id: r.id, name: r.name, cover: r.cover, type: '餐厅' })
      continue
    }
    const rt = routes.find((x) => x.id === id)
    if (rt) {
      favs.push({ id: rt.id, name: rt.title, cover: rt.cover, type: '路线', price: rt.price })
      continue
    }
    const p = posts.find((x) => x.id === id)
    if (p) favs.push({ id: p.id, name: p.title, cover: p.images[0], type: '游记' })
  }
  return ok(favs)
}

export async function toggleFavorite(id: string) {
  await delay(100)
  if (db.favorites.has(id)) db.favorites.delete(id)
  else db.favorites.add(id)
  return ok({ favorited: db.favorites.has(id) })
}

export function isFavorite(id: string): boolean {
  return db.favorites.has(id)
}

/* ---------- 购物车 ---------- */

export async function getCart() {
  await delay(160)
  return ok(db.cart)
}

export async function addToCart(item: Omit<CartItem, 'id' | 'checked'>) {
  await delay(180)
  const exist = db.cart.find((c) => c.productId === item.productId && c.sku === item.sku)
  if (exist) {
    if (exist.qty + item.qty > item.stock) throw new ApiError(3002, '库存不足')
    exist.qty += item.qty
  } else {
    db.cart.unshift({ ...item, id: 'c' + Date.now(), checked: true })
  }
  return ok(db.cart)
}

export async function updateCartItem(id: string, patch: Partial<Pick<CartItem, 'qty' | 'checked' | 'sku'>>) {
  await delay(120)
  const item = db.cart.find((c) => c.id === id)
  if (!item) throw new ApiError(1003, '资源不存在')
  if (patch.qty != null) {
    if (patch.qty > item.stock) throw new ApiError(3002, '库存不足')
    item.qty = patch.qty
  }
  if (patch.checked != null) item.checked = patch.checked
  if (patch.sku != null) item.sku = patch.sku
  return ok(db.cart)
}

export async function removeCartItem(id: string) {
  await delay(120)
  db.cart = db.cart.filter((c) => c.id !== id)
  return ok(db.cart)
}

export async function checkCart() {
  await delay(200)
  const invalid = db.cart.filter((c) => c.qty > c.stock)
  return ok({ invalidIds: invalid.map((c) => c.id) })
}

/* ---------- 订单 ---------- */

export interface CreateOrderPayload {
  type: OrderType
  title: string
  cover: string
  summary: string
  amount: number
  qty: number
  shop: string
  cartItemIds?: string[]
}

export async function createOrder(payload: CreateOrderPayload) {
  await delay(420)
  const order: Order = {
    orderNo: nextOrderNo(),
    type: payload.type,
    status: 'UNPAID',
    title: payload.title,
    cover: payload.cover,
    summary: payload.summary,
    amount: payload.amount,
    qty: payload.qty,
    date: fmtDate(0),
    shop: payload.shop,
  }
  db.orders.unshift(order)
  if (payload.cartItemIds?.length) {
    db.cart = db.cart.filter((c) => !payload.cartItemIds!.includes(c.id))
  }
  return ok(order)
}

export async function payOrder(orderNo: string) {
  await delay(500)
  const order = db.orders.find((o) => o.orderNo === orderNo)
  if (!order) throw new ApiError(1003, '订单不存在')
  if (order.status !== 'UNPAID') throw new ApiError(3001, '订单状态不允许该操作')
  order.status = order.type === 'LODGING' || order.type === 'MEAL' ? 'PAID' : 'PAID'
  return ok(order)
}

export async function cancelOrder(orderNo: string) {
  await delay(300)
  const order = db.orders.find((o) => o.orderNo === orderNo)
  if (!order) throw new ApiError(1003, '订单不存在')
  if (!['UNPAID', 'PAID'].includes(order.status)) throw new ApiError(3001, '订单状态不允许该操作')
  order.status = 'CANCELLED'
  return ok(order)
}

export async function refundOrder(orderNo: string) {
  await delay(360)
  const order = db.orders.find((o) => o.orderNo === orderNo)
  if (!order) throw new ApiError(1003, '订单不存在')
  if (!['PAID', 'CONFIRMED'].includes(order.status)) throw new ApiError(3001, '订单状态不允许该操作')
  order.status = 'REFUNDED'
  return ok(order)
}

export async function getOrders(filter?: { type?: OrderType | 'ALL'; status?: OrderStatus | 'ALL' }) {
  await delay(260)
  let list = [...db.orders]
  if (filter?.type && filter.type !== 'ALL') list = list.filter((o) => o.type === filter.type)
  if (filter?.status && filter.status !== 'ALL') list = list.filter((o) => o.status === filter.status)
  return ok(list)
}

/* ---------- 消息 / 地址 ---------- */

export async function getMessages() {
  await delay(180)
  return ok(db.messages)
}

export async function markMessageRead(id: string) {
  await delay(100)
  const m = db.messages.find((x) => x.id === id)
  if (m) m.read = true
  return ok(true)
}

export async function markAllMessagesRead() {
  await delay(100)
  db.messages.forEach((m) => (m.read = true))
  return ok(true)
}

export async function getAddresses() {
  await delay(140)
  return ok(db.addresses)
}

/* ---------- 个人资料 ---------- */

export async function updateProfile(patch: Partial<Pick<UserProfile, 'name' | 'bio'>>) {
  await delay(200)
  if (!db.user) throw new ApiError(1001, '未登录')
  Object.assign(db.user, patch)
  return ok(db.user)
}
