/**
 * 首页与搜索的静态内容 Mock。
 * 用户中心、收藏、购物车、订单、地址、消息等业务已全部切换为真实后端接口。
 */
import type { LiveInfo, LiveWeather } from '@/types'
import {
  banners,
  announcements,
  goods,
  specialties,
  restaurants,
  homestays,
  routes,
  posts,
  hotKeywords,
} from './data'

export interface Envelope<T> {
  code: number
  message: string
  data: T
}

const delay = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms))

function ok<T>(data: T, message = 'ok'): Envelope<T> {
  return { code: 0, message, data }
}

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

const ALTITUDE = 1300
const FESTIVAL_DATE = new Date('2026-11-11T00:00:00')
const WUDONG_LAT = 26.38
const WUDONG_LON = 108.08

const WEATHER_CODE_TEXT: Record<number, string> = {
  0: '晴',
  1: '大部晴朗',
  2: '多云',
  3: '阴',
  45: '雾',
  48: '雾凇',
  51: '毛毛雨',
  53: '小毛毛雨',
  55: '浓毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  80: '阵雨',
  81: '强阵雨',
  82: '暴雨',
  95: '雷阵雨',
  96: '雷阵雨伴冰雹',
  99: '强雷阵雨',
}

const WEATHER_POOL = [
  { text: '多云', temp: 22 },
  { text: '晴', temp: 25 },
  { text: '小雨', temp: 18 },
  { text: '阴', temp: 20 },
  { text: '晴间多云', temp: 23 },
]

function todayWeather(): LiveWeather {
  const now = new Date()
  const base = WEATHER_POOL[Math.floor(now.getTime() / 86400000) % WEATHER_POOL.length]
  const delta = Math.round(Math.sin((((now.getHours() - 6) / 24) * Math.PI * 2)) * 3)
  return {
    text: base.text,
    temp: base.temp + delta,
    high: base.temp + 4,
    low: base.temp - 3,
  }
}

async function fetchWeather(): Promise<LiveWeather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${WUDONG_LAT}&longitude=${WUDONG_LON}` +
    '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min' +
    '&timezone=Asia/Shanghai&forecast_days=1'
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`weather api status ${res.status}`)
    const data = await res.json()
    return {
      text: WEATHER_CODE_TEXT[data.current.weather_code] ?? '未知',
      temp: Math.round(data.current.temperature_2m),
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
    }
  } catch {
    return todayWeather()
  }
}

function todayVisitors(): number {
  const now = new Date()
  const wave = Math.max(0, Math.sin((((now.getHours() - 6) / 18) * Math.PI)))
  const base =
    Math.round(Array.from({ length: now.getDate() }).reduce((sum, _, index) => sum + (index % 7), 0)) %
    120
  return 120 + Math.round(wave * 760) + base
}

function festivalCountdown() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(FESTIVAL_DATE.getFullYear(), FESTIVAL_DATE.getMonth(), FESTIVAL_DATE.getDate())
  return {
    name: '苗年节',
    date: `${FESTIVAL_DATE.getMonth() + 1}月${FESTIVAL_DATE.getDate()}日`,
    daysLeft: Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000)),
  }
}

export async function getLiveInfo(): Promise<Envelope<LiveInfo>> {
  await delay(140)
  return ok<LiveInfo>({
    altitude: ALTITUDE,
    weather: await fetchWeather(),
    visitorsToday: todayVisitors(),
    festival: festivalCountdown(),
  })
}

export async function searchAll(keyword: string) {
  await delay(300)
  const kw = keyword.trim().toLowerCase()
  const match = (value: string) => value.toLowerCase().includes(kw)
  return ok({
    goods: [...goods, ...specialties].filter(
      (item) => match(item.title) || match(item.subtitle) || match(item.category),
    ),
    restaurants: restaurants.filter(
      (item) => match(item.name) || match(item.tags.join('')),
    ),
    homestays: homestays.filter(
      (item) => match(item.name) || match(item.tags.join('')),
    ),
    routes: routes.filter((item) => match(item.title) || match(item.theme)),
    posts: posts.filter(
      (item) => match(item.title) || match(item.content) || match(item.topic || ''),
    ),
  })
}
