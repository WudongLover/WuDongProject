import { defineStore } from 'pinia'
import * as api from '@/api'
import type { UserProfile } from '@/types'

const KEY = 'wudong_user'

function loadSaved(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: loadSaved(),
    toastQueue: [] as { id: number; text: string }[],
  }),
  getters: {
    isLoggedIn: (s) => !!s.user,
  },
  actions: {
    toast(text: string) {
      const id = Date.now() + Math.random()
      this.toastQueue.push({ id, text })
      setTimeout(() => {
        this.toastQueue = this.toastQueue.filter((t) => t.id !== id)
      }, 2600)
    },
    async login(payload: { phone: string; password?: string; smsCode?: string }) {
      const res = await api.login(payload)
      this.user = res.data.user
      sessionStorage.setItem(KEY, JSON.stringify(this.user))
      return res.data
    },
    async register(payload: { phone: string; smsCode: string; password: string; name: string }) {
      const res = await api.register(payload)
      this.user = res.data.user
      sessionStorage.setItem(KEY, JSON.stringify(this.user))
      return res.data
    },
    logout() {
      // 先清本地，服务端撤销异步执行；后端不可达也不影响本地退出
      api.logout().catch(() => {})
      this.user = null
      sessionStorage.removeItem(KEY)
    },
    /** 应用启动时用 refresh Cookie 静默恢复登录态 */
    async bootstrap() {
      try {
        const res = await api.fetchMe()
        this.user = res.data
        sessionStorage.setItem(KEY, JSON.stringify(this.user))
      } catch {
        this.user = null
        sessionStorage.removeItem(KEY)
      }
    },
    requireLogin(): boolean {
      if (this.user) return true
      this.toast('请先登录')
      return false
    },
  },
})
